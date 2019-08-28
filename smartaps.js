var io = require('socket.io')(8072);
const util = require('util');
var sql = require('mssql');
var config = {
    user: 'sa',
    password: 'tbw!2020',
    server: 'portal.tobeway.com',
    port: 1812,
    database: 'WS정밀'
}

console.log('0. created')
io.on('connection', function (socket) {
    console.log('1. connected')
    socket.on("GetVersion", function () {
        var selectQuery = ' SELECT distinct( version_no ) FROM dbo.EQP_PLAN  ';
        sql.connect(config, function(err) {
            if(err) { console.log(err);  sql.close(); return; }
            var request = new sql.Request();
            request.query(selectQuery, function(err, {recordset}) {
                if(err) { console.log(err);  return; }
                var res = { rowCount: recordset.length, rows: recordset}
                socket.emit("ResultGetVersion", res);    //받은 오브젝트 정보를 던짐
                sql.close();
            });
        });
    });
    socket.on("GetOrder", function (data) {             //Objectpropertis UI에 들어갈 key값과 value값 호출
        if(data === null || data === undefined) return;

        var lastEqp;
        GetLastEqp().then(function(lastEqp1) {
            lastEqp = lastEqp1;
            return GetReleaseHistory();
        }).then(function(release) {
            return GetOrderFromEqpPlan(data.version_no, release, lastEqp);
        }).then(function(orders) {
            // orders.forEach(function(row, idx, array) {
            //     console.log(row)
            // });    
            orders.sort(function(a,b) {
                if( a.ordertime.valueOf() === b.ordertime.valueOf() )
                    return a.orderid < b.orderid ? -1: 1
                else
                    return a.ordertime.valueOf() < b.ordertime.valueOf() ? -1: 1
            });
            //orders.sort(function(a,b) {
            //    return a.orderid < b.orderid ? -1: 1
            //});
            //  console.log('orderid, ordertype, ordertime, objid, targetobjid1, targetobjid2')
            //  orders.forEach(function(row, idx, array) {
            //     if(row.targetobjid1 === 'LOT_PROD01_01_23')
            //         console.log(row.orderid + "," + row.ordertype + "," + row.ordertime + "," + row.objid + "," + row.targetobjid1 + "," + row.targetobjid2)
            // });
            var res = { rowCount: orders.length, rows: orders}
            socket.emit("ResultGetOrder", res);    //받은 오브젝트 정보를 던짐
        }).catch(function (err) {
            console.error(err); // Error 출력
        });
    });

    //------------------------------Order Generation from VMS------------------------------------ 
    function GetLastEqp() {
        return new Promise(function(resolve, reject) {
            sql.connect(config, function(err) {
                if(err) { reject(err); return;  }
                var request = new sql.Request();
                var q = "SELECT PRODUCT_ID, PROCESS_ID, STEP_ID, eqp_id, TACT_TIME, PROC_TIME, EFF_START_DATE, EFF_END_DATE "
                    + "FROM dbo.EQP_ARRANGE "
                    + "WHERE STEP_ID in "
                    + "(SELECT TOP 1 STEP_ID "
                        + "FROM dbo.STEP_ROUTE R "
                        + "INNER JOIN dbo.PRODUCT P ON R.PROCESS_ID = P.PROCESS_ID "
                        + "WHERE P.PRODUCT_TYPE = 'FG' "
                        + "ORDER BY STEP_SEQ DESC) ";
                request.query(q, function(err1, {recordset} ) {
                    if(err1) { reject(err1); sql.close(); return;  }
                    var lastEqp = [];
                    recordset.forEach(function(row, idx, array) {
                        lastEqp.push(row.eqp_id)
                    });
                    resolve(lastEqp);
                    sql.close();
                });
            });
        });
    }
    function GetReleaseHistory() {
        return new Promise(function(resolve, reject) {
            sql.connect(config, function(err) {
                if(err) { reject(err); return;  }
                var request = new sql.Request();
                var q = "SELECT batch_id, lot_id ,product_id, release_date, input_step_id, qty FROM [dbo].[RELEASE_HISTORY]";
                request.query(q, function(err1, {recordset} ) {
                    if(err1) { reject(err1); sql.close(); return;  }
                    resolve(recordset);
                    sql.close();
                });
            });
        });
    }
    function GetOrderFromEqpPlan(version_no, release, lastEqp) {
        console.log(lastEqp)
        return new Promise(function(resolve, reject) {
        var FIRST_EQP = 'DBANK';
        var orders = [];
        sql.connect(config, function(err1) {
            if(err1) { 
                reject(err1); 
                return; 
            }
            var request = new sql.Request();
            var orderId = 1;
            var plan = [];
            var lotsCreated = [];
            release.forEach(function(row, idx, array) {
                row.dispatch_in_time = row.release_date;
                var start_time = new Date(row.release_date)
                start_time.setTime ( start_time.getTime() - 1000 );
                row.start_time = start_time;
                row.eqp_id = FIRST_EQP;
                plan.push(row)
                orders.push( { 
                    version_no: version_no,
                    orderid: orderId, 
                    ordertype: 'CREA', 
                    ordertime: row.release_date,
                    beforeorderid: null, 
                    objid: FIRST_EQP, 
                    targetobjid1: row.lot_id, 
                    targetobjid2: row.product_id, 
                    parameter: null
                });
                orderId++;
                lotsCreated.push(row.lot_id)
            });
            var q = "SELECT version_no, line_id, eqp_id, lot_id, product_id, process_id, step_id, process_qty, dispatch_in_time, start_time, end_time, machine_state ";
            q += "FROM dbo.EQP_PLAN ";
            q += "WHERE VERSION_NO = '" + version_no + "' ";
            q += "ORDER BY dispatch_in_time, start_time ";
            request.query(q, function(err, { recordset }) {
                if(err) { 
                    reject(err); 
                    sql.close();
                    return; 
                }
                //lot 추출
                recordset.forEach(function(row, idx, array) {
                    plan.push(row);
                });
                recordset.forEach(function(row, idx, array) {
                    var eqpid = row.eqp_id;

                    //lot이 없으면 생성
                    if(!lotsCreated.includes(row.lot_id)) {
                        orders.push( { 
                            version_no: version_no,
                            orderid: orderId, 
                            ordertype: 'CREA', 
                            ordertime: row.dispatch_in_time ? row.dispatch_in_time : row.start_time,
                            beforeorderid: null, 
                            objid: row.eqp_id, 
                            targetobjid1: row.lot_id, 
                            targetobjid2: row.product_id, 
                            parameter: null
                        });
                        orderId++;
                        lotsCreated.push(row.lot_id)
                    }

                    if(row.dispatch_in_time != null) {
                        var prev_eqp_id = findPrevEqp(plan, row);
                        if(prev_eqp_id !== null) {
                            orders.push( { 
                                version_no: version_no,
                                orderid: orderId, 
                                ordertype: 'TRAN', 
                                //같은 장비에서 이동는 경우도 고려
                                ordertime: prev_eqp_id === eqpid || prev_eqp_id === FIRST_EQP ? row.start_time : row.dispatch_in_time, 
                                beforeorderid: null, 
                                objid: prev_eqp_id, 
                                targetobjid1: row.lot_id, 
                                targetobjid2: eqpid, 
                                parameter: null
                            });
                            orderId++;
                        }
                    }

                    if(row.start_time != null) {                    
                        orders.push( { 
                            version_no: version_no,
                            orderid: orderId, 
                            ordertype: 'PROC', 
                            ordertime: row.start_time,
                            beforeorderid: null, 
                            objid: eqpid, 
                            targetobjid1: row.lot_id, 
                            targetobjid2: null, 
                            parameter: null
                        });  
                        orderId++;
                    }
                    
                    if(row.end_time != null) {
                        orders.push( { 
                            version_no: version_no,
                            orderid: orderId, 
                            ordertype: 'ENDT', 
                            ordertime: row.end_time,
                            beforeorderid: null, 
                            objid: eqpid, 
                            targetobjid1: row.lot_id, 
                            targetobjid2: null, 
                            parameter: null
                        });  
                        orderId++;
                        if(lastEqp.includes(eqpid)) {
                            orders.push( { 
                                version_no: version_no,
                                orderid: orderId, 
                                ordertype: 'TRAN', 
                                ordertime: row.end_time, 
                                beforeorderid: null, 
                                objid: eqpid, 
                                targetobjid1: row.lot_id, 
                                targetobjid2: "DOCK", 
                                parameter: null
                            });
                            orderId++;
                        }                
                    }
                }) 
                console.log(orders.length)
                resolve(orders);
                sql.close();
            });
        });
        });
    }

    function findNextEqp(lots, lot) {
        var next_eqp_id = null;
        for(var i=0; i<lots.length; i++) {
            var row = lots[i];
            if(row.dispatch_in_time > lot.dispatch_in_time && row.lot_id == lot_id) {
                next_eqp_id = row.eqp_id;
                break;
            }
        }
        return next_eqp_id;
    }
    function findPrevEqp(plan, lot) {
        var prev_eqp_id = null;
        for(var i=0; i<plan.length; i++) {
            var row = plan[i];
            if(row.lot_id === lot.lot_id) {
                if(row.dispatch_in_time.valueOf() > lot.dispatch_in_time.valueOf() 
                  || (row.dispatch_in_time.valueOf() === lot.dispatch_in_time.valueOf() && row.start_time.valueOf() >= lot.start_time.valueOf()) )
		    break;
                else 
                    prev_eqp_id = row.eqp_id;
            }
        }
        return prev_eqp_id;
    }

})