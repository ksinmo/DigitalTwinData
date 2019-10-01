var io = require('socket.io')(8072);
var edge = require('edge'); //nodejs 7.10.1과 호환됨.
const util = require('util');
var sql = require('mssql');
var config = {
    user: 'sa',
    password: 'tbw!2020',
    server: 'portal.tobeway.com',
    port: 1812,
    database: 'WS정밀',
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
    }
}
console.log('0. created')
const connectPool = new sql.ConnectionPool(config).connect();
// const connectPool = new sql.ConnectionPool(config, err => {
//     console.log(err)
// }).connect();

var clrMethod = edge.func({
    assemblyFile: 'Mozart.DataActions.dll',
    typeName: 'Samples.FooBar.MyType',
    methodName: 'MyMethod' // This must be Func<object,Task<object>>
});
var hello = edge.func(function () {/*
    async (input) => { 
        string folderDir = @"C:\Users\김신모\Downloads\ReadData API\Result 0";
        Mozart.DataActions.LocalFileStorage lfs = new Mozart.DataActions.LocalFileStorage(folderDir);
        return "CSharp welcomes " + input.ToString(); 
    }
*/});

hello('Node.js', function (error, result) {
    if (error) throw error;
    console.log(result);
});

io.on('connection', function (socket) {
    var version_no, order_id=1;
    console.log('1. connected')
    socket.on("GetVersion", function () {
        var q = ' SELECT distinct( version_no ) FROM dbo.EQP_PLAN ORDER BY 1 DESC ';
        connectPool.then((pool) => {
            return pool.request()
            .query(q)
        }).then( ({recordset}) => {
            var res = { rowCount: recordset.length, rows: recordset}
            socket.emit("ResultGetVersion", res);    
            sql.close();
        }).catch(err => {
            console.log(err);
            sql.close();
        });        
    });
    socket.on("GetProduct", function (data) {
        var eqp_id = data ?  data.eqp_id : '';
        var q = ' SELECT P.product_id, product_name, product_type, P.process_id, PR.process_name, lot_size, input_batch_size, cust_code, A.eqp_id '
            + 'FROM dbo.PRODUCT P '
            + 'LEFT OUTER JOIN dbo.PROCESS PR ON P.PROCESS_ID = PR.PROCESS_ID '
            + 'LEFT OUTER JOIN  dbo.EQP_ARRANGE A ON P.product_id = A.product_id AND A.eqp_id = @eqp_id ';

        connectPool.then((pool) => {
            return pool.request()
            .input("eqp_id", sql.VarChar(30), eqp_id)
            .query(q)
        }).then( ({recordset}) => {
            var res = { rowCount: recordset.length, rows: recordset}
            socket.emit("ResultGetProduct", res);    
            sql.close();
        }).catch(err => {
            console.log(err);
            sql.close();
        });            
        
    });
    socket.on("UpdateEqpArrange", function (data) {
        var q = 'DELETE FROM dbo.EQP_ARRANGE '
            + 'WHERE eqp_id = @eqp_id';
        var localPool;
        var allPromise = [];
        connectPool.then((pool) => {
            localPool = pool;
            return pool.request()
            .input("eqp_id", sql.VarChar(30), data.eqp_id)
            .query(q)
        }).then( () => {
            if(!data.rows) {
                sql.close();
                return;
            }
            var q = 'INSERT INTO dbo.EQP_ARRANGE '
                + '(PRODUCT_ID, PROCESS_ID, STEP_ID, EQP_ID, TACT_TIME, PROC_TIME, EFF_START_DATE, EFF_END_DATE) '
                + ' VALUES(@product_id, @process_id, @step_id, @eqp_id, 300, 300, \'\', \'\') ';
            data.rows.forEach(function(row) {
                allPromise.push(localPool.request()
                    .input("product_id", sql.VarChar(30), row.product_id)
                    .input("process_id", sql.VarChar(30), row.process_id)
                    .input("step_id", sql.VarChar(30), row.step_id)
                    .input("eqp_id", sql.VarChar(30), data.eqp_id)
                    .query(q)
                );
            });   
            Promise.all(allPromise).then(function(res) {
                sql.close();
            });
        }).catch(err => {
            console.log(err);
            sql.close();
        });
    });
    socket.on("UpdateEquipmentPreset", function (data) {
        console.log("UpdateEquipmentPreset :" + data.eqp_id + "," + data.preset_id)
        var q = 'UPDATE dbo.EQUIPMENT '
            + 'SET PRESET_ID = @preset_id '
            + 'WHERE EQP_ID = @eqp_id ';
        connectPool.then((pool) => {
            localPool = pool;
            return pool.request()
            .input("preset_id", sql.VarChar(30), data.preset_id)
            .input("eqp_id", sql.VarChar(30), data.eqp_id)
            .query(q)
        }).then( () => {
            sql.close();
        }).catch(err => {
            console.log(err);
            sql.close();
        });            
    });
    socket.on("GetOrder", function (data) {             //Objectpropertis UI에 들어갈 key값과 value값 호출
        if(data === null || data === undefined) return;
        version_no = data.version_no;

        var release, mergeWip;
        GetReleaseHistory(data.version_no).then(function(_release) {
            release = _release;
            return GetMergeWipLog(data.version_no);
        }).then(function(_mergeWip) {
            mergeWip = _mergeWip;
            return GetEqpPlan(data.version_no);
        }).then(function(eqpPlan) {
            return GetOrderFromEqpPlan(release, mergeWip, eqpPlan);
        }).then(function(orders) {
            // orders.forEach(function(row, idx, array) {
            //     console.log(row)
            // });    
            //시간순으로 정렬
            orders.sort(function(a,b) {
                if( a.ordertime.valueOf() === b.ordertime.valueOf() )
                    return a.orderid < b.orderid ? -1: 1
                else
                    return a.ordertime.valueOf() < b.ordertime.valueOf() ? -1: 1
            });
            //마지막 BREAK는 삭제.
            var done=false;
            for(var i=orders.length-1; i>=0 && !done; i--) {
                if(orders[i].ordertype === 'BRKS' || orders[i].ordertype === 'BRKE') {
                    orders.pop();
                } else {
                    done = true;
                }
            }
            console.log('orderid, ordertype, ordertime, objid, targetobjid1, targetobjid2')
            orders.forEach(function(row, idx, array) {
            //     if(row.targetobjid1 === 'LOT_PROD01_01_3'
            //     || row.targetobjid1 === 'LOT_PROD01_02_2'
            //     || row.targetobjid1 === 'LOT_PROD01_05_1'
            //     || row.targetobjid1 === 'LOT_PROD01_03_1'
            //     || row.targetobjid1 === 'LOT_PROD01_04_3'
            //     || row.targetobjid1 === 'LOT_PROD01_06_1'
            //     || row.targetobjid1 === 'LOT_PROD01_1' )
                console.log(row.orderid + "," + row.ordertype + "," + row.ordertime + "," + row.objid + "," + row.targetobjid1 + "," + row.targetobjid2 + "," + row.parameter)
            });
            var res = { rowCount: orders.length, rows: orders}
            socket.emit("ResultGetOrder", res);    //받은 오브젝트 정보를 던짐
        }).catch(function (err) {
            console.error(err); // Error 출력
        });
    });


    //------------------------------Order Generation from VMS------------------------------------ 
    function GetLastEqp() {
        return new Promise(function(resolve, reject) {
            var q = "SELECT product_id, process_id, step_id, eqp_id, tact_time, proc_time, eff_start_date, eff_end_date "
                + "FROM dbo.EQP_ARRANGE "
                + "WHERE STEP_ID in "
                + "(SELECT TOP 1 STEP_ID "
                + "FROM dbo.STEP_ROUTE R "
                + "INNER JOIN dbo.PRODUCT P ON R.PROCESS_ID = P.PROCESS_ID "
                + "WHERE P.PRODUCT_TYPE = 'FG' "
                + "ORDER BY STEP_SEQ DESC) ";
            connectPool.then((pool) => {
                return pool.request()
                .query(q)
            }).then( ({recordset}) => {
                var lastEqp = [];
                recordset.forEach(function(row, idx, array) {
                    lastEqp.push(row.eqp_id)
                });
                resolve(lastEqp);
                sql.close();
            }).catch(err => {
                sql.close();
                reject(err); 
                return;  
            });
        });
    }
    function GetReleaseHistory(version_no) {
        return new Promise(function(resolve, reject) {
            var q = "SELECT batch_id, lot_id ,product_id, release_date, input_step_id, qty "
                + "FROM [dbo].[RELEASE_HISTORY] "
                + "WHERE version_no = @version_no ";
            connectPool.then((pool) => {
                return pool.request()
                .input("version_no", sql.VarChar(30), version_no)
                .query(q)
            }).then( ({recordset}) => {
                resolve(recordset)
                sql.close();
            }).catch(err => {
                sql.close();
                reject(err); 
                return;  
            });
        });
    }
    function GetMergeWipLog(version_no) {
        return new Promise(function(resolve, reject) {
            var q = "SELECT version_no, fr_lot_id, to_lot_id, fr_product_id, to_product_id, oper_id, fr_unit_qty, to_unit_qty " 
                + "FROM dbo.MERGE_WIPLOG "
                + "WHERE version_no = @version_no ";
            connectPool.then((pool) => {
                return pool.request()
                .input("version_no", sql.VarChar(30), version_no)
                .query(q)
            }).then( ({recordset}) => {
                resolve(recordset)
                sql.close();
            }).catch(err => {
                sql.close();
                reject(err); 
                return;  
            });
        });
    }
    function GetEqpPlan(version_no) {
        return new Promise(function(resolve, reject) {
            var q = "SELECT version_no, line_id, eqp_id, lot_id, product_id, process_id, step_id, process_qty, dispatch_in_time, start_time, end_time, machine_state "
                + "FROM dbo.EQP_PLAN "
                + "WHERE version_no = @version_no "
                + "ORDER BY dispatch_in_time, start_time ";
            connectPool.then((pool) => {
                return pool.request()
                .input("version_no", sql.VarChar(30), version_no)
                .query(q)
            }).then( ({recordset}) => {
                resolve(recordset)
                sql.close();
            }).catch(err => {
                sql.close();
                reject(err); 
                return;  
            });
        });
    }

    function makeOrder(ordertype, ordertime, objid, targetobjid1=null, targetobjid2=null, parameter=null) {
        return { 
            "version_no": version_no,
            "orderid": order_id++, 
            "ordertype": ordertype, 
            "ordertime": ordertime,
            "beforeorderid": null, 
            "objid": objid,
            "targetobjid1": targetobjid1,
            "targetobjid2": targetobjid2,
            "parameter": parameter
        }; 
    }
    function GetOrderFromEqpPlan(release, mergeWip, eqpPlan) {
        return new Promise(function(resolve, reject) {
            var FIRST_EQP = 'DBANK';
            var LAST_EQP = 'DOCK';
            var orders = [];
            var plan = [];
            var lotsCreated = {};
            release.forEach(function(row, idx, array) {
                row.dispatch_in_time = row.release_date;
                var start_time = new Date(row.release_date)
                start_time.setTime ( start_time.getTime() - 1000 );
                row.start_time = start_time;
                row.eqp_id = FIRST_EQP;
                plan.push(row)
                orders.push(makeOrder('CREA', row.release_date, FIRST_EQP, row.lot_id, row.product_id));
                lotsCreated[row.lot_id] = row.qty;
            });               
            //plan 합침
            eqpPlan.forEach(function(row, idx, array) {
                if(row.machine_state === "SETUP") { //Setup은 처리하지 않는다.
                } else if(row.machine_state === "BREAK" ) {
                    orders.push(makeOrder('BRKS', row.start_time, row.eqp_id));
                    orders.push(makeOrder('BRKE', row.end_time, row.eqp_id));
                } else {
                    plan.push(row);
                }
            });
            eqpPlan.forEach(function(row, idx, array) {
                var eqpid = row.eqp_id;
                var from_lot = findMergeWip(mergeWip, row.lot_id, row.step_id);
                if(row.machine_state === "SETUP" || row.machine_state === "BREAK") {

                } else if(from_lot.length === 0 ) {
                    //조립 변형이 안된 경우
                    //lot이 없으면 생성
                    if(!lotsCreated[row.lot_id]) {
                        orders.push(makeOrder('CREA', row.dispatch_in_time ? row.dispatch_in_time : row.start_time,
                            row.eqp_id, row.lot_id, row.product_id));
                        lotsCreated[row.lot_id] = row.process_qty;
                    }
                    if(row.dispatch_in_time != null) {
                        var prev_plan = findPrevPlan(plan, row.lot_id, row.dispatch_in_time, row.start_time);
                        if(prev_plan !== null) {
                            orders.push(makeOrder( 'TRAN', 
                                //같은 장비에서 이동는 경우도 고려
                                prev_plan.eqp_id === eqpid || prev_plan.eqp_id === FIRST_EQP ? row.start_time : row.dispatch_in_time, 
                                prev_plan.eqp_id, row.lot_id, eqpid));
                        }
                    }

                    if(row.start_time != null) {                    
                        orders.push( makeOrder('PROC', row.start_time, eqpid, row.lot_id));
                    }
                    
                    if(row.end_time != null) {
                        orders.push( makeOrder('ENDT', row.end_time, eqpid, row.lot_id));
                        //if(lastEqp.includes(eqpid)) {
                        //    orders.push( makeOrder('TRAN', row.end_time, eqpid, row.lot_id, LAST_EQP));
                        //}                
                    }
                } else { // 조립, 변형이 된 경우
                    from_lot.forEach(function(wiprow, idx, array) {
                        var tran_lot_id = wiprow.fr_lot_id;
                        if(row.dispatch_in_time != null) {
                            var prev_plan = findPrevPlan(plan, wiprow.fr_lot_id, row.dispatch_in_time, row.start_time);
                            //LOT Split. 가져와야 하는 것이 남은것보다 작으므로 lot split. 임시 lot 생성 
                            if(wiprow.fr_unit_qty < lotsCreated[wiprow.fr_lot_id]) {
                                lotsCreated[wiprow.fr_lot_id] -= wiprow.fr_unit_qty;
                                tran_lot_id = wiprow.fr_lot_id + 'T';
                                orders.push(makeOrder('CREA', 
                                    row.dispatch_in_time ? row.dispatch_in_time : row.start_time,
                                    prev_plan.eqp_id, tran_lot_id, 
                                    wiprow.fr_product_id));
                            }
                            if(prev_plan !== null) {
                                orders.push(makeOrder('TRAN', 
                                    //같은 장비에서 이동는 경우도 고려
                                    prev_plan.eqp_id === eqpid || prev_plan.eqp_id === FIRST_EQP ? row.start_time : row.dispatch_in_time, 
                                    prev_plan.eqp_id, tran_lot_id, eqpid));
                            }
                        }
                        if(row.start_time != null) {                    
                            orders.push( makeOrder('PROC', row.start_time, eqpid, tran_lot_id));
                        }
                        
                        if(row.end_time != null) {
                            //조립 완료 후 생성. ENDT의 targetobjid2가 있으면 client에서 생성함.
                            orders.push( makeOrder('ENDT', row.end_time, eqpid, 
                                tran_lot_id, row.lot_id, row.product_id));
                            //client에서 생성한 lot은 이후에도 생성하지 않음
                            if(!lotsCreated[row.lot_id]) {
                                lotsCreated[row.lot_id] = row.process_qty;
                            }
                            //if(lastEqp.includes(eqpid)) {
                            //    orders.push(makeOrder('TRAN', row.end_time,  eqpid, row.lot_id, LAST_EQP));
                            //}
                        }
                    });
                }                    
            }) 
            console.log(orders.length)
            resolve(orders);
            sql.close();
        }).catch(err => {
            sql.close();
            reject(err); 
            return;  
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
    
    function findPrevPlan(plan, lot_id, dispatch_in_time, start_time) {
        var prev_plan = null;
        for(var i=0; i<plan.length; i++) {
            var row = plan[i];
            if(row.lot_id === lot_id) {
                if(row.dispatch_in_time.valueOf() > dispatch_in_time.valueOf() 
                  || (row.dispatch_in_time.valueOf() === dispatch_in_time.valueOf() && row.start_time.valueOf() >= start_time.valueOf()) )
                    break;
                else 
                    prev_plan = row;
            }
        }
        return prev_plan;
    }

    function findMergeWip(mergeWip, lot_id, step_id) {
        var result = []
        mergeWip.forEach(function(row){
            if(row.to_lot_id === lot_id && row.oper_id === step_id) 
                result.push(row);
        });
        return result;
    }

})