var io = require('socket.io')(8072);
const util = require('util');
var sql = require('mssql');
var config = {
    user: 'sa',
    password: 'tbw!2020',
    server: 'portal.tobeway.com',
    port: 1812,
    database: 'aps'
}

console.log('0. created')
io.on('connection', function (socket) {
    console.log('1. connected')

    socket.on("GetOrder", function (prop) {             //Objectpropertis UI에 들어갈 key값과 value값 호출
        GetOrderFromEqpPlan().then(function(orders) {
            // orders.forEach(function(row, idx, array) {
            //     console.log(row)
            // });    
            orders.sort(function(a,b) {
                return a.ordertime < b.ordertime ? -1: 1
            });
            orders.sort(function(a,b) {
                return a.orderid < b.orderid ? -1: 1
            });
            //orders.forEach(function(row, idx, array) {
            //    console.log(row)
            //});
            var res = { rowCount: orders.length, rows: orders}
            socket.emit("ResultGetOrder", res);    //받은 오브젝트 정보를 던짐
        });
    });

    //------------------------------Order Generation from VMS------------------------------------ 
    function GetOrderFromEqpPlan() {
        return new Promise(function(resolve, reject) {
        var FIRST_STEP = 'STEP01';
        var FIRST_EQP = 'DBANK';
        var LAST_STEP = 'STEP07';
        var LAST_EQP = 'DOCK';
        var orders = [];
        sql.connect(config, function(err) {
            if (err) console.log(err);
            var request = new sql.Request();
            var q = "SELECT eqp_id, lot_id, product_id, process_id, step_id, lot_qty, dispatch_in_time, start_time, end_time, tool_id FROM dbo.eqpplan WHERE scenario_id = 'S02' ";
            request.query(q, function(err, recordset) {
                if(err) console.log(err);
                //console.log(recordset.recordset);


                var orderId = 1;
                console.log('Creation Order');
                var lots = [];
                var total_start_time = recordset.recordset[0].start_time;


                recordset.recordset.forEach(function(row, idx, array) {
                    var eqpid = row.eqp_id;
                    if(eqpid == '') {
                        if(row.step_id == 'STEP04') eqpid = 'BUCK01';
                        else if(row.step_id == 'STEP06') eqpid = 'BUCK02';
                        else if(row.step_id == 'STEP07') eqpid = 'FINSP';
                    }
                    lots.push({lot_id: row.lot_id, eqp_id: eqpid, dispatch_in_time: row.dispatch_in_time, step_id: row.step_id});
                    //WIP은 시작 시점에 모두 생성함 -> 완료되는 것만 생성함.
                    if(row.step_id == LAST_STEP) {
                        orders.push( { 
                            orderid: orderId, 
                            ordertype: 'CREA', 
                            ordertime: total_start_time,
                            beforeorderid: null, 
                            objid: row.lot_id, 
                            targetobjid1: FIRST_EQP, 
                            targetobjid2: null, 
                            parameter: null
                        });
                        orderId++;
                    }
                });
                recordset.recordset.forEach(function(row, idx, array) {
                    var eqpid = row.eqp_id;
                    if(eqpid == '') {
                        if(row.step_id == 'STEP04') eqpid = 'BUCK01';
                        else if(row.step_id == 'STEP06') eqpid = 'BUCK02';
                        else if(row.step_id == 'STEP07') eqpid = 'FINSP';
                    }
                    //console.log("[" + orderId + "] " + eqpid + "," + row.lot_id + "," + row.dispatch_in_time );


                    if(lots.filter(x => x.lot_id === row.lot_id && x.step_id === LAST_STEP).length == 0) return; //최초 생성되지 않는 명령은 수행하지 않음.


                    //시작 시간을 첫 Eqp 시작 10분 전으로 수정
                    if(row.step_id == FIRST_STEP && row.start_time != null) { 
                        var start_time = new Date(row.start_time)
                        var tran_time = new Date ( start_time );
                        if( row.start_time > total_start_time)
                            tran_time.setTime ( start_time.getTime() - 10*60*1000 );
                        orders.push( { 
                            orderid: orderId, 
                            ordertype: 'TRAN', 
                            ordertime: tran_time,
                            beforeorderid: null, 
                            objid: FIRST_EQP, 
                            targetobjid1: row.lot_id, 
                            targetobjid2: eqpid, 
                            parameter: null
                        });                        
                        orderId++;
                    }


                    if(row.start_time != null) {                    
                        orders.push( { 
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


                        var next_eqp_id;
                        if(row.step_id == LAST_STEP) next_eqp_id = LAST_EQP;
                        else  next_eqp_id = findNextEqp(lots, row.lot_id, row.dispatch_in_time);
                        //console.log('TRAN next_eqp_id = ' + next_eqp_id);
                        orders.push( { 
                            orderid: orderId, 
                            ordertype: 'TRAN', 
                            ordertime: row.end_time,
                            beforeorderid: null, 
                            objid: eqpid, 
                            targetobjid1: row.lot_id, 
                            targetobjid2: next_eqp_id, 
                            parameter: null
                        });
                        orderId++;
                    }
                }) 
                console.log(orders.length)
                resolve(orders);
            });
        });
        });
    }

    function findNextEqp(lots, lot_id, dispatch_in_time) {
        var next_eqp_id;
        for(var i=0; i<lots.length; i++) {
            var row = lots[i];
            if(row.dispatch_in_time > dispatch_in_time && row.lot_id == lot_id) {
                next_eqp_id = row.eqp_id;
                break;
            }
        }
        return next_eqp_id;
    }

})