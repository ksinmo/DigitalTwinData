var io = require('socket.io')(8071);
const { Client } = require('pg');
const util = require('util');
const redis = require('redis');
const promise = require('promise');
var redisClient = redis.createClient(6379, 'mdmcloud.tobeway.com');
const OBJECT_STATUS_CHANNEL = "ObjectStatus";

console.log('0. created')
io.on('connection', function (socket) {
    console.log('1. connected')
    
    const pgpool = new Client({
        host: 'mdmcloud.tobeway.com',
        port: 5432,
        user: 'dtusr',
        password: 'dtusr',
        database: 'dt'
        //max: 10,
        //idleTimeoutMillis: 300000
    });

    pgpool.connect((err) => {
        if (err) {
            console.error('connection error', err.stack);
        } else {
            console.log('2. pg connected');
        }
    });

    socket.on('disconnect', function () {
        console.log('-------------- user disconnect----------')
        //if (socket.id in players) delete players[socket.id]
    })

    socket.on('test', function (player) {
        socket.emit('test')
        // Print current players for debugging
        console.log("확인");
    })

    //------------------------------로그인----------------------------

    socket.on("Login", function (data) {
        console.log("on Login syne. ID : " + data.ID + ",PW : " + data.Password);
        var LoginSelect =
            ' SELECT UsrID, Passwd ' +
            ' FROM cockpit.Usr ' +
            ' where UsrID = $1 and Passwd = $2 ';

        var LoginSelectParam = [data.ID, data.Password];
        
        pgpool.query(LoginSelect, LoginSelectParam, (err, res) => {
            if (err) throw err
            socket.emit("LoginResult", res);
        });

    });


    socket.on("AccountIDCheck", function (data) {
        console.log("AccountIDCheck : " + data.ID);
        var AccountSelect =
            ' SELECT UsrID FROM cockpit.Usr where UsrID = $1';
        var AccountSelectParam = [data.ID];

        pgpool.query(AccountSelect, AccountSelectParam, (err, res) => {
            if (err) throw err
            socket.emit("AccountCheckResult", res);
        });
    });

    socket.on("Account", function (data) {
        console.log(data.ID + "," + data.Password + "," + data.UserName_En + "," + data.UserName_Ko);

        var AccountInsert =
            ' INSERT INTO cockpit.Usr(' +
            '   UsrID, Name_EN, Name_KO, Passwd)' +
            ' VALUES ($1, $2, $3, $4);'

        var AccountInsertParam = [data.ID, data.UserName_En, data.UserName_Ko, data.Password];

        pgpool.query(AccountInsert, AccountInsertParam, (err, res) => {
            if (err) throw err
            socket.emit("AccountResult", res);
        });
    });

    socket.on("FindPW", function (data) {
        console.log(data.ID + "," + data.UserName_En);

        var FindPWSelect =
            'SELECT UsrID FROM cockpit.Usr where UsrID = $1 AND Name_EN = $2 ';
        var FindPWSelectParam = [data.ID, data.UserName_En];

        pgpool.query(FindPWSelect, FindPWSelectParam, (err, res) => {
            if (err) throw err
            socket.emit("FindPWResult", res);
        });
    });


    socket.on("SetNewPW", function (data) {
        console.log(data.ID + "," + data.Password);

        var newPwUpdate =
            'UPDATE cockpit.Usr ' +
            ' SET Passwd = $1' +
            ' WHERE UsrID = $2 ';
        var newPwUpdateParam = [data.Password, data.ID];

        pgpool.query(newPwUpdate, newPwUpdateParam, (err, res) => {
            if (err) throw err          
            socket.emit("SetNewPWResult", res);          
        });

    });

    //------------------------------모델링------------------------------------    

    socket.on("GetObject", function (prop) {
        console.log("GetObject");
        var selectParam;
        if(!isnull(prop))  selectParam = [prop.applid];

        var selectQuery =
            'SELECT O.objid, O.classid, objname_en objname, C.classname_en classname,'
            + ' positionx, positiony, positionz, '
            + ' rotationx, rotationy, rotationz, '
            + ' scalex, scaley, scalez, '
            + ' speed , O.description, C.classtype, '
            + ' ORG.orgid, ORG.orgname_en orgname, '
            + ' ctrl1, ctrl2 '
            + ' FROM cockpit.object O '
            + ' LEFT OUTER JOIN cockpit.class C ON O.classid = C.classid '
            + ' LEFT OUTER JOIN cockpit.org ON O.orgid = ORG.orgid '
            + ' WHERE applid = $1 ';
            if(!isnull(prop) && !isnull(prop.objid)) {
                selectParam.push(prop.objid);
                selectQuery += ' AND objid = $2 ';
            }
            selectQuery += ' ORDER BY O.dispseq;';

        var selectQuery2 =
            'SELECT O.objid, O.classid, O.propid, P.propname_en propname, O.propval, P.ismonitor '
            + 'FROM cockpit.objpropval O '
            + 'LEFT OUTER JOIN cockpit.prop P ON O.propid = P.propid '
            + 'WHERE objid = $1 '
            + 'ORDER BY P.dispseq ';

        pgpool.query(selectQuery, selectParam, (err, res) => {
            if (errlog(err)) return;

            res.rows.forEach(function(row, idx, array) {
                var selectParam2 = [row.objid];
                pgpool.query(selectQuery2, selectParam2, (err, res2) => {
                    if (errlog(err)) return;

                    row.prop = res2.rows;
                    if(idx == array.length - 1) { //last row select completed
                        console.log("send ResultGetObject : " + util.inspect(res, {showHidden: false, depth: null}));
                        if(array.length == 1) 
                            socket.emit("ResultGetObject", res);   //받은 오브젝트 정보를 던짐
                        else
                            socket.emit("ResultGetAllObject", res);   //받은 오브젝트 정보를 던짐
                    }
                });                
            });
        });
    });    
    //---------------------------------save Event-------------------------------
    //Object 테이블에 받은 정보를 insert 함
    socket.on("ObjectTableInsert", function (data) {

        console.log("ObjectTableInsert");
        console.log(util.inspect(data, {showHidden: false, depth: null}));

        if(isnull(data)) return;

        var insertQuery =
            'INSERT INTO cockpit.object(  objid, classid, objname_en, positionx, positiony, positionz, rotationX, rotationY, rotationz, '
            + ' scaleX, scaleY, scaleZ, speed, '
            //+ ' CreatedAt, CreatedBy, UpdatedAt, UpdatedBy, Description)'
            + 'description, active, applid) '
            + 'VALUES '
            + '( $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, \'Y\', $15 )';

        var objectDeleteQuery = 'DELETE FROM cockpit.object WHERE applid = $1';//다 지우고
        //var objPropValdeleteQuery = 'DELETE FROM cockpit.objpropval ';//DB에서 처리. Cascade FK
        pgpool.query(objectDeleteQuery, [data.rows[0]["applid"]], (err, res) => {
            if (errlog(err)) return;

            data.rows.forEach(function(row) {
                //console.log(util.inspect(row["prop"], {showHidden: false, depth: null}));  
                var insertParam =
                    [
                        row["objid"], row["classid"], row["objname"],
                        row["positionx"], row["positiony"], row["positionz"],
                        row["rotationx"], row["rotationy"], row["rotationz"],
                        row["scalex"], row["scaley"], row["scalez"], row["speed"],
                        //row["createdat"], row["createdby"], row["updatedat"], row["updatedby"]
                        row["description"], row["applid"]
                    ];
                
                pgpool.query(insertQuery, insertParam, (err, res) => {
                    if (errlog(err)) return;

                    console.log("insert success");
                    objPropValInsert(row["objid"], row["classid"], row["prop"]);
                });
            });    
        });

    });

    function objPropValInsert(objid, classid, prop) {
        var insertQuery = 'INSERT INTO cockpit.objpropval(objid, classid, propid, propval) VALUES ($1, $2, $3, $4);';
        var propids = [];

        if(!isnull(prop)) {
            prop.forEach(function(row) {
                //console.log(util.inspect(row, {showHidden: false, depth: null}));  
                var insertParam = [row["objid"], row["classid"], row["propid"], row["propval"]];
                propids.push(row["propid"]);
                pgpool.query(insertQuery, insertParam, (err, res) => {
                    if (errlog(err)) return;
                });
            });
        }

        //입력 요청한 데이터에 빠진 속성을 추가해서 입력함. 부모 클래스의 속성도 구해야 함. Recursive CTE
        var selectQuery =
            'WITH RECURSIVE CTE AS '
            + '( SELECT  classid, parentclassid  FROM    cockpit.class WHERE   classid = $1 '
            + '  UNION ALL '
            + ' SELECT  C.classid, C.parentclassid FROM cockpit.class C '
            + '  INNER JOIN CTE ON CTE.parentclassid = C.classid '
            + ' )  '
            + 'SELECT classid, CP.propid, defpropval, propname_en propname, CP.dispseq '
            + 'FROM cockpit.classprop CP '
            + 'LEFT OUTER JOIN cockpit.prop P ON CP.propid = P.propid '
            + 'where classid in (SELECT classid FROM CTE) '
            + 'ORDER BY CP.dispseq '
        var selectParam = [classid];        
        pgpool.query(selectQuery, selectParam, (err, res) => {
            if (errlog(err)) return;
            res.rows.forEach(function(row, idx, array) {
                if(!propids.includes(row["propid"])) {
                    var insertParam = [objid, row["classid"], row["propid"], null];
                    pgpool.query(insertQuery, insertParam, (err, res) => {
                        if (errlog(err)) return;
                    });
                }
            });
        });

    }

    socket.on("GetOrderData", function (prop) {             //Objectpropertis UI에 들어갈 key값과 value값 호출
        console.log("On GetOrderData: prop=" + prop);
        var selectParam;
        if(!isnull(prop)) selectParam = [prop.scenarioid];

        var selectQuery = ' SELECT scenarioid, orderid, ordertype, ordertime, beforeorderid, objid, targetobjid1, targetobjid2, parameter, pause ';
        selectQuery += ' FROM cockpit.order '
        if(!isnull(selectParam))
            selectQuery += ' WHERE scenarioid = $1 ';
        selectQuery += ' ORDER BY ordertime, orderid ';

        pgpool.query(selectQuery, selectParam, (err, res) => {
            if (errlog(err)) return;
            socket.emit("ResultOrderData", res);    //받은 오브젝트 정보를 던짐

        });
    });

    socket.on("GetScenario", function (data) {
        console.log("On GetScenario");
        var selectParam;
        if(!isnull(data)) 
            selectParam =  [data.applid];

        var selectQuery = ' SELECT scenarioid, name_en "name", note, active, dispseq ';
        selectQuery += ' FROM cockpit.scenario ';
        if(!isnull(selectParam))
            selectQuery += 'WHERE applid = $1 '
        selectQuery += ' ORDER BY dispseq ';

        pgpool.query(selectQuery, selectParam, (err, res) => {
            if (errlog(err)) return;
            socket.emit("ResultGetScenario", res);    //받은 오브젝트 정보를 던짐

        });
    });

    socket.on("GetClass", function (data) {             //Objectpropertis UI에 들어갈 key값과 value값 호출

        console.log("On GetClass");
        if(isnull(data)) return;
        
        var selectQuery = '';
        var selectParam = '';
        //CATE인 경우만 appl을 적용합니다.
        if(data.parentclassid == 'ROOT') {
            selectQuery = ' SELECT C.classid, classname_en, classname_ko, parentclassid, AC.dispseq, classtype, active, createdat, description, z_iconpath, isleaf ' +
                ' FROM cockpit.class C ' +
                ' LEFT OUTER JOIN cockpit.applclass AC ON C.classid = AC.classid ' +
                ' WHERE AC.applid = $1 and C.parentclassid = $2 ' +
            '    order by AC.dispseq '
            selectParam = [data.applid, data.parentclassid];
        }
        else {
            selectQuery = ' SELECT C.classid, classname_en, classname_ko, parentclassid, C.dispseq, classtype, active, createdat, description, z_iconpath, isleaf ' +
                ' FROM cockpit.class C ' +
                ' LEFT OUTER JOIN cockpit.applclass AC ON C.classid = AC.classid ' +
                ' WHERE C.parentclassid = $1 ' +
                ' order by C.dispseq '
            selectParam = [data.parentclassid];
        }
            
        pgpool.query(selectQuery, selectParam, (err, res) => {
            if (errlog(err)) return;

            socket.emit("ResultClass", res);    //받은 오브젝트 정보를 던짐
            console.log("send ResultClass : " + util.inspect(res, {showHidden: false, depth: null}));

        });   
    });   
    
    socket.on("GetOrg", function (data) {     
        console.log("On GetOrg");
        if(isnull(data)) return;
        var selectParam =  [data.usrid];

        var selectQuery = 'SELECT U.usrid, name_en "name", O.orgid, orgname_en orgname, parentorgid, dispseq '
            + 'FROM cockpit.usr U '
            + 'LEFT OUTER JOIN cockpit.usrorg UO ON U.usrid = UO.usrid '
            + 'LEFT OUTER JOIN cockpit.org O ON UO.orgid = O.orgid '
            + 'WHERE U.usrid = $1 '
            + 'AND U.active = \'Y\' '
            + 'AND O.active = \'Y\' '
            + 'ORDER BY dispseq ';

        pgpool.query(selectQuery, selectParam, (err, res) => {
            if (errlog(err)) return;
            socket.emit("ResultGetOrg", res); 

        });
    });
    socket.on("GetAppl", function (data) {     
        console.log("On GetAppl");
        if(isnull(data)) return;
        var selectParam =  [data.usrid];

        var selectQuery = 'SELECT U.usrid, name_en "name", permittype, permittoid, applid, applname_en applname, dispseq '
            + 'FROM cockpit.usr U '
            + 'LEFT OUTER JOIN cockpit.usrrole UR ON U.usrid = UR.usrid '
            + 'LEFT OUTER JOIN cockpit.rolepermit RP ON UR.roleid = RP.roleid '
            + 'LEFT OUTER JOIN cockpit.appl A ON RP.permittoid = A.applid '
            + 'WHERE permittype = \'APPL\' '
            + 'AND U.usrid = $1 '
            + 'AND U.active = \'Y\' '
            + 'AND A.active = \'Y\' '
            + 'ORDER BY dispseq '
        
        pgpool.query(selectQuery, selectParam, (err, res) => {
            if (errlog(err)) return;
            socket.emit("ResultGetAppl", res); 

        });
    });
    socket.on("GetMenu", function (data) {     
        console.log("On GetMenu");
        if(isnull(data)) return;
        var selectParam =  [data.usrid];

        var selectQuery = 'SELECT U.usrid, name_en "name", permittype, permittoid, menuid, menuname_en menuname, parentmenuid, description, dispseq '
            + 'FROM cockpit.usr U '
            + 'LEFT OUTER JOIN cockpit.usrrole UR ON U.usrid = UR.usrid '
            + 'LEFT OUTER JOIN cockpit.rolepermit RP ON UR.roleid = RP.roleid '
            + 'LEFT OUTER JOIN cockpit.menu M ON RP.permittoid = M.menuid '
            + 'WHERE permittype = \'MENU\' '
            + '  AND U.usrid = $1 '
            + '  AND U.active = \'Y\''
            + '  AND M.active = \'Y\''
            + 'ORDER BY dispseq '

        pgpool.query(selectQuery, selectParam, (err, res) => {
            if (errlog(err)) return;
            socket.emit("ResultGetMenu", res); 

        });
    });


    //------------------------------모니터링------------------------------------
    var last_status_fetch_time;
    //최초 호출할 때는 Changed와 관계없이 모든 Status를 반환한다.
    socket.on("GetAllStatus", function (data) {
        console.log("GetAllStatus");
        var selectQuery =
            'SELECT O.objid, O.classid, O.propid, P.propname_en propname, O.propval, O.changed, O.updatedat '
            + 'FROM cockpit.objpropval O '
            + 'LEFT OUTER JOIN cockpit.prop P ON O.propid = P.propid '
            + 'WHERE P.ismonitor = \'Y\' ';

        pgpool.query(selectQuery, (err, res) => {
            if (errlog(err)) return;
            console.log("send ResultGetStatus : " + util.inspect(res, {showHidden: false, depth: null}));
            socket.emit("ResultGetAllStatus", res); 
        });
    });
    socket.on("GetStatus", function (data) {
        console.log("GetStatus: last_status_fetch_time=" + last_status_fetch_time);
     
        var selectQuery =
            'SELECT O.objid, O.classid, O.propid, P.propname_en propname, O.propval, O.changed, O.updatedat '
            + 'FROM cockpit.objpropval O '
            + 'LEFT OUTER JOIN cockpit.prop P ON O.propid = P.propid '
            + 'WHERE P.ismonitor = \'Y\' ';
            
        if(last_status_fetch_time != undefined && last_status_fetch_time != null) 
            selectQuery += ' AND (O.changed = \'Y\' OR updatedat > \'' + getUTCFormat(last_status_fetch_time) + '\') ';
        else
            selectQuery += ' AND O.changed = \'Y\'';

        selectQuery += 'ORDER BY P.dispseq ';

        pgpool.query(selectQuery, (err, res) => {
            if (errlog(err)) return;
            console.log("send ResultGetStatus : " + util.inspect(res, {showHidden: false, depth: null}));
            socket.emit("ResultGetStatus", res); 
        });

        var updateQuery =
            'UPDATE cockpit.objpropval O '
            + 'SET changed = \'N\' ' 
            + ',updatedat = \'' + getUTCFormat(new Date()) + '\' '
            + 'FROM cockpit.prop P '
            + 'WHERE O.propid = P.propid '
            + '  AND P.ismonitor = \'Y\' ';
        if(last_status_fetch_time != undefined && last_status_fetch_time != null) 
            updateQuery += ' AND (O.changed = \'Y\' OR updatedat > \'' + getUTCFormat(last_status_fetch_time) + '\') ';
        else
            updateQuery += ' AND O.changed = \'Y\'';
        last_status_fetch_time = new Date();

        pgpool.query(updateQuery, (err, res) => {
            if (errlog(err)) return;
            console.log('update ok');
        });
    });

    // pub/sub
    // PUBLISH ObjectStatus EQP01:OPERATING:Y
    redisClient.on("message", function(channel, message) {
        console.log(channel + ',' + message);
        if(channel != OBJECT_STATUS_CHANNEL) return;

        var result = {command: 'SELECT', rowCount: 1, oid: null, rows: []};
        var keysplit = message.split(':');
        if(keysplit.length == 3) {
            result.rows.push({objid:keysplit[0], propid:keysplit[1], propval:keysplit[2]});
            socket.emit("ResultGetStatus", result); 
        }
    });   
    redisClient.subscribe(OBJECT_STATUS_CHANNEL);
    
    //사용하지 않음. pub/sub로 변경
    function getStatusFromRedis(data) {
        console.log("GetStatus: last_status_fetch_time=" + last_status_fetch_time);
        var dataPromise = function(key) {
            return new Promise(function(resolve, reject){
                redisClient.hgetall(key, function(err, res) {
                    resolve({key, val:res});
                });
            });
        }
        var allRecords = [];
        new Promise(function(resolve, reject) {
            redisClient.keys("ObjectStatus*", function(err, res) {
                if (err) reject(err);
                else resolve(res);
            });
        }).then(function(res){
            var arrPromise = [];
            res.forEach(function(row) {
                arrPromise.push(dataPromise(row));
            });
            Promise.all(arrPromise).then(function(res) {
                allRecords = res.filter(x => x != undefined && x != null);
                //CHANGED == Y만 추출
                var result = {command: 'SELECT', rowCount: 0, oid: null, rows: []};
                allRecords.forEach(function(row){
                    var keysplit = row.key.split(':');
                    if(keysplit.length == 2) {
                        result.rows.push({objid:keysplit[1], propid:row.val["propid"], propval:row.val["propval"], changed:row.val["changed"]});                            
                    }
                });
                result.rowCount = result.rows.length;
                console.log("all completed : " + util.inspect(result, {showHidden: false, depth: null}));
                socket.emit("ResultGetStatus", result); 
            });
        }).catch(function(err) {
            console.log(err);
        });     
        last_status_fetch_time = new Date();
    }

    socket.on("GetResult", function (data) {
        console.log("GetResult");
        if(isnull(data)) return;
        var selectParam =  [data.usrid, data.applid];
        var selectQuery =
            'SELECT resultid, usrid, applid, scenarioid, resultname, updateat '
            + 'FROM cockpit.result '
            + 'WHERE usrid = $1 '
            + '  AND applid = $2 '
            + 'ORDER BY updateat ';

        pgpool.query(selectQuery, selectParam, (err, res) => {
            if (errlog(err)) return;
            console.log("send ResultGetResult : " + util.inspect(res, {showHidden: false, depth: null}));
            socket.emit("ResultGetResult", res); 
        });
    });

    socket.on("GetResultDetail", function (data) {
        console.log("GetResultDetail");
        if(isnull(data)) return;
        var selectParam =  [data.resultid];
        var selectQuery =
            'SELECT resultid, wipjson, performancejson, alertjson, alertdetailjson '
            + 'FROM cockpit.result '
            + 'WHERE resultid = $1 ';

        pgpool.query(selectQuery, selectParam, (err, res) => {
            if (errlog(err)) return;
            res.rows[0].wipjson = JSON.parse(res.rows[0].wipjson);
            res.rows[0].performancejson = JSON.parse(res.rows[0].performancejson);
            res.rows[0].alertjson = JSON.parse(res.rows[0].alertjson);
            res.rows[0].alertdetailjson = JSON.parse(res.rows[0].alertdetailjson);
            console.log("send ResultGetResultDetail : " + util.inspect(res, {showHidden: false, depth: null}));
            socket.emit("ResultGetResultDetail", res); 
        });
    });

    socket.on("InsertResult", function (data) {
        console.log("InsertResult");
        if(isnull(data)) return;
        var insertParam =  [data.usrid, data.applid, data.scenarioid, data.resultname, getUTCFormat(new Date()), 
            JSON.stringify(data.wipjson), JSON.stringify(data.performancejson), JSON.stringify(data.alertjson), JSON.stringify(data.alertdetailjson)];
        var insertQuery =
            'INSERT INTO cockpit.result( '
            + 'usrid, applid, scenarioid, resultname, updateat, wipjson, performancejson, alertjson, alertdetailjson) '
            + 'VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9 ) ';

        pgpool.query(insertQuery, insertParam, (err, res) => {
            if (errlog(err)) 
                console.log('InsertResult error: ' + data.usrid + ',' + data.scenarioid); 
        });
    });

    //yyyy-MM-dd hh:mm:ss
    function getUTCFormat(timestamp) {
        var dateFormat = timestamp.getUTCFullYear() + '-' + String(timestamp.getUTCMonth() + 1).padStart(2, '0') + '-' + String(timestamp.getUTCDate()).padStart(2, '0');
        var timeFormat = String(timestamp.getUTCHours()).padStart(2, '0') + ':' + String(timestamp.getUTCMinutes()).padStart(2, '0') + ':' + String(timestamp.getUTCSeconds()).padStart(2, '0');    
        return dateFormat + ' ' + timeFormat;
    }
    function errlog(err) {
        if(err) {
            console.log( "errorlog");
            console.log(err);
            return true;
        }
        else {
            return false;
        }
    };
    function isnull(data) {
        if(data == undefined || data == null) {
            console.log('data is null.');
            return true;
        }
        return false;
    }





     //------------------------------Order Generation from VMS------------------------------------   
    socket.on("CreateOrderFromEqpPlan", function (data) {             //Objectpropertis UI에 들어갈 key값과 value값 호출
        var FIRST_STEP = 'STEP01';
        var FIRST_EQP = 'DBANK';
        var LAST_STEP = 'STEP07';
        var LAST_EQP = 'DOCK';
        console.log("On CreateOrderFromEqpPlan");

        var selectQuery = ' select scenario_id, eqp_id, lot_id, product_id, process_id, step_id, lot_qty, dispatch_in_time, start_time, end_time, tool_id from cockpit.eqpplan order by dispatch_in_time' ;
        var insertQuery = 'INSERT INTO cockpit.order ( scenarioid, orderid, ordertype, ordertime, beforeorderid, objid, targetobjid1, targetobjid2, parameter)  VALUES (\'S02\', $1, $2, $3, $4, $5, $6, $7, $8);';    

        pgpool.query(selectQuery, '', (err, res) => {
            if (errlog(err)) return;

            var orderId = 1;
            console.log('Creation Order');
            var lots = [];
            var total_start_time = res.rows[0].start_time;

            orderId += insertShift(total_start_time, insertQuery);

            res.rows.forEach(function(row, idx, array) {
                var eqpid = row.eqp_id;
                if(eqpid == '') {
                    if(row.step_id == 'STEP04') eqpid = 'BUCK01';
                    else if(row.step_id == 'STEP06') eqpid = 'BUCK02';
                    else if(row.step_id == 'STEP07') eqpid = 'FINSP';
                }
                lots.push({lot_id: row.lot_id, eqp_id: eqpid, dispatch_in_time: row.dispatch_in_time, step_id: row.step_id});
                //WIP은 시작 시점에 모두 생성함 -> 완료되는 것만 생성함.
                if(row.step_id == LAST_STEP) {
                    var insertParam = [ orderId, 'CREA', total_start_time, null, row.lot_id, FIRST_EQP, null, null];
                    pgpool.query(insertQuery, insertParam, (err, res) => {
                        if(err) throw err
                        console.log('INSERT OK');
                    });
                    orderId++;
                }
            });
            res.rows.forEach(function(row, idx, array) {
                var eqpid = row.eqp_id;
                if(eqpid == '') {
                    if(row.step_id == 'STEP04') eqpid = 'BUCK01';
                    else if(row.step_id == 'STEP06') eqpid = 'BUCK02';
                    else if(row.step_id == 'STEP07') eqpid = 'FINSP';
                }
                console.log("[" + orderId + "] " + eqpid + "," + row.lot_id + "," + row.dispatch_in_time );

                if(lots.filter(x => x.lot_id === row.lot_id && x.step_id === LAST_STEP).length == 0) return; //최초 생성되지 않는 명령은 수행하지 않음.

                //시작 시간을 첫 Eqp 시작 10분 전으로 수정
                if(row.step_id == FIRST_STEP && row.start_time != null) { 
                    var start_time = new Date(row.start_time)
                    var tran_time = new Date ( start_time );
                    if( row.start_time > total_start_time)
                        tran_time.setTime ( start_time.getTime() - 10*60*1000 );
                    var insertParam = [ orderId, 'TRAN', tran_time, null, FIRST_EQP, row.lot_id, eqpid, null];
                    pgpool.query(insertQuery, insertParam, (err, res) => {
                        if (errlog(err)) return;
                        console.log('INSERT OK');
                    });
                    orderId++;
                }

                if(row.start_time != null) {                    
                    var insertParam = [ orderId, 'PROC', row.start_time, null, eqpid, row.lot_id, null, null];
                    pgpool.query(insertQuery, insertParam, (err, res) => {
                        if (errlog(err)) return;
                        console.log('INSERT OK');
                    });
                    orderId++;
                }
                
                if(row.end_time != null) {
                    var insertParam = [ orderId, 'ENDT', row.end_time, null, eqpid, row.lot_id, null, null];
                    pgpool.query(insertQuery, insertParam, (err, res) => {
                        if (errlog(err)) return;
                        console.log('INSERT OK');
                    });
                    orderId++;

                    var next_eqp_id;
                    if(row.step_id == LAST_STEP) next_eqp_id = LAST_EQP;
                    else  next_eqp_id = findNextEqp(lots, row.lot_id, row.dispatch_in_time);
                    console.log('TRAN next_eqp_id = ' + next_eqp_id);
                    var insertParam = [ orderId, 'TRAN', row.end_time, null, eqpid, row.lot_id, next_eqp_id,  row.transfer_time];
                    pgpool.query(insertQuery, insertParam, (err, res) => {
                        if (errlog(err)) return;
                        console.log('INSERT OK');
                    });
                    orderId++;
                }
            });
        });
    });

    function insertShift(start_time, insertQuery) {
        //SHIFT 
        var start_time_8 = new Date(start_time.getTime() + 8*60*60*1000);
        var start_time_16 = new Date(start_time.getTime() + 16*60*60*1000);
        var start_time_24 = new Date(start_time.getTime() + 24*60*60*1000);
        var insertParam = [ 1, 'SHFT', start_time, null, null, null, null, 'SHIFT #1'];
        pgpool.query(insertQuery, insertParam, (err, res) => {
            if(err) throw err
            console.log('SHIFT INSERT OK');
        });        
        var insertParam = [ 2, 'SHFE', start_time_8, null, null, null, null, 'SHIFT #1'];
        pgpool.query(insertQuery, insertParam, (err, res) => {
            if(err) throw err
            console.log('SHIFT INSERT OK');
        });
        var insertParam = [ 3, 'SHFT', start_time_8, null, null, null, null, 'SHIFT #2'];
        pgpool.query(insertQuery, insertParam, (err, res) => {
            if(err) throw err
            console.log('SHIFT INSERT OK');
        });        
        var insertParam = [ 4, 'SHFE', start_time_16, null, null, null, null, 'SHIFT #2'];
        pgpool.query(insertQuery, insertParam, (err, res) => {
            if(err) throw err
            console.log('SHIFT INSERT OK');
        });        
        var insertParam = [ 5, 'SHFT', start_time_16, null, null, null, null, 'SHIFT #3'];
        pgpool.query(insertQuery, insertParam, (err, res) => {
            if(err) throw err
            console.log('SHIFT INSERT OK');
        });        
        var insertParam = [ 6, 'SHFE', start_time_24, null, null, null, null, 'SHIFT #3'];
        pgpool.query(insertQuery, insertParam, (err, res) => {
            if(err) throw err
            console.log('SHIFT INSERT OK');
        });      

        return 6;
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