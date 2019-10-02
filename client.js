const util = require('util')
var socket = require('socket.io-client')('http://localhost:8071');
//var socket = require('socket.io-client')('http://portal.tobeway.com:1814');

var socketSaps = require('socket.io-client')('http://localhost:8072');
//var socketSaps = require('socket.io-client')('http://portal.tobeway.com:1813'); //1813 -> 8072

socket.on('connect', function(){
    // socket.emit('InsertResult', 
    // {
    //     usrid: 'ksm',
    //     applid: 'SAPS',
    //     scenarioid: 'TSK-20190828-174438',
    //     resultname: 'TSK-20190828-174438 Result',
    //     updatedat: '2019-09-02 05:14:14',
    //     wipjson: JSON.parse('[{"objname":"황삭","objid":"STEP01","DQ":0,"PROC":0,"WQ":0},{"objname":"1차조립01","objid":"STEP02","DQ":0,"PROC":0,"WQ":0},{"objname":"정삭01","objid":"STEP04","DQ":0,"PROC":0,"WQ":0},{"objname":"정삭02","objid":"STEP06","DQ":0,"PROC":0,"WQ":0},{"objname":"1차조립02","objid":"STEP07","DQ":0,"PROC":0,"WQ":0},{"objname":"2차조립","objid":"STEP97","DQ":0,"PROC":0,"WQ":0},{"objname":"최종","objid":"STEP98","DQ":0,"PROC":0,"WQ":0},{"objname":"Inital Storage","objid":"AREA01","DQ":0,"PROC":0,"WQ":0},{"objname":"Final Storage","objid":"AREA02","DQ":0,"PROC":46,"WQ":0}]'),
    //     performancejson: JSON.parse('[{"objname":"Inital Storage","objid":"AREA01","PROD01":0,"PROD01_01":29,"PROD01_02":29,"PROD01_03":29,"PROD01_04":29,"PROD01_05":0,"PROD01_06":0},{"objname":"Final Storage","objid":"AREA02","PROD01":32,"PROD01_01":0,"PROD01_02":0,"PROD01_03":0,"PROD01_04":0,"PROD01_05":0,"PROD01_06":0},{"objname":"황삭","objid":"STEP01","PROD01":0,"PROD01_01":29,"PROD01_02":29,"PROD01_03":29,"PROD01_04":29,"PROD01_05":0,"PROD01_06":0},{"objname":"1차조립01","objid":"STEP02","PROD01":0,"PROD01_01":29,"PROD01_02":30,"PROD01_03":0,"PROD01_04":0,"PROD01_05":0,"PROD01_06":0},{"objname":"정삭01","objid":"STEP04","PROD01":0,"PROD01_01":0,"PROD01_02":29,"PROD01_03":0,"PROD01_04":0,"PROD01_05":0,"PROD01_06":0},{"objname":"정삭02","objid":"STEP06","PROD01":0,"PROD01_01":0,"PROD01_02":0,"PROD01_03":29,"PROD01_04":0,"PROD01_05":0,"PROD01_06":0},{"objname":"1차조립02","objid":"STEP07","PROD01":0,"PROD01_01":0,"PROD01_02":0,"PROD01_03":36,"PROD01_04":35,"PROD01_05":6,"PROD01_06":5},{"objname":"2차조립","objid":"STEP97","PROD01":0,"PROD01_01":0,"PROD01_02":0,"PROD01_03":0,"PROD01_04":0,"PROD01_05":30,"PROD01_06":25},{"objname":"최종","objid":"STEP98","PROD01":31,"PROD01_01":0,"PROD01_02":0,"PROD01_03":0,"PROD01_04":0,"PROD01_05":0,"PROD01_06":0}]'),
    //     alertjson: JSON.parse('[{"objid":"EQP07","objname":"EQP07","STATE":"Busy","COUNT":6,"ELAPSED":"337510400000"},{"objid":"EQP07","objname":"EQP07","STATE":"Lazy","COUNT":1,"ELAPSED":"288358400000"},{"objid":"EQP06","objname":"EQP06","STATE":"Busy","COUNT":6,"ELAPSED":"411238400000"},{"objid":"EQP06","objname":"EQP06","STATE":"Lazy","COUNT":1,"ELAPSED":"262144000000"},{"objid":"EQP17","objname":"EQP17","STATE":"Busy","COUNT":1,"ELAPSED":"18022400000"},{"objid":"EQP21","objname":"EQP21","STATE":"Busy","COUNT":2,"ELAPSED":"36044800000"},{"objid":"EQP23","objname":"EQP23","STATE":"Lazy","COUNT":1,"ELAPSED":"1638400000"},{"objid":"EQP26","objname":"EQP26","STATE":"Lazy","COUNT":1,"ELAPSED":"19660800000"},{"objid":"EQP25","objname":"EQP25","STATE":"Lazy","COUNT":1,"ELAPSED":"675020800000"},{"objid":"EQP01","objname":"EQP01","STATE":"Lazy","COUNT":1,"ELAPSED":"352256000000"},{"objid":"DOCK","objname":"Final Storage","STATE":"Full","COUNT":1,"ELAPSED":"306380800000"},{"objid":"EQP02","objname":"EQP02","STATE":"Lazy","COUNT":1,"ELAPSED":"288358400000"},{"objid":"EQP03","objname":"EQP03","STATE":"Lazy","COUNT":1,"ELAPSED":"262144000000"}]'),
    //     alertdetailjson: JSON.parse('[{"ID":"1","EqpID":"EQP07","EqpName":"","State":"Busy","StartTime":"2019-09-10 12:12:22","ElapsedTime":"3844"},{"ID":"1","EqpID":"EQP06","EqpName":"","State":"Busy","StartTime":"2019-09-10 12:12:22","ElapsedTime":"3233"},{"ID":"2","EqpID":"EQP07","EqpName":"","State":"Busy","StartTime":"2019-09-10 12:12:22","ElapsedTime":"1222"},{"ID":"2","EqpID":"EQP06","EqpName":"","State":"Busy","StartTime":"2019-09-10 12:12:22","ElapsedTime":"62259198594"},{"ID":"3","EqpID":"EQP07","EqpName":"","State":"Busy","StartTime":"637027737317970585","ElapsedTime":"90111997965"},{"ID":"3","EqpID":"EQP06","EqpName":"","State":"Busy","StartTime":"637027794661969290","ElapsedTime":"90111997965"},{"ID":"1","EqpID":"EQP17","EqpName":"","State":"Busy","StartTime":"637027974885965220","ElapsedTime":"18022399593"},{"ID":"1","EqpID":"EQP21","EqpName":"","State":"Busy","StartTime":"637027974885965220","ElapsedTime":"18022399593"},{"ID":"4","EqpID":"EQP07","EqpName":"","State":"Busy","StartTime":"637028889113144574","ElapsedTime":"57343998705"},{"ID":"4","EqpID":"EQP06","EqpName":"","State":"Busy","StartTime":"637028946457143279","ElapsedTime":"27852799371"},{"ID":"5","EqpID":"EQP07","EqpName":"","State":"Busy","StartTime":"637028974309942650","ElapsedTime":"62259198594"},{"ID":"5","EqpID":"EQP06","EqpName":"","State":"Busy","StartTime":"637028979225142539","ElapsedTime":"85196798076"},{"ID":"6","EqpID":"EQP07","EqpName":"","State":"Busy","StartTime":"637029036569141244","ElapsedTime":"90111997965"},{"ID":"6","EqpID":"EQP06","EqpName":"","State":"Busy","StartTime":"637029064421940615","ElapsedTime":"88473598002"},{"ID":"2","EqpID":"EQP21","EqpName":"","State":"Busy","StartTime":"637029703397926185","ElapsedTime":"18022399593"},{"ID":"1","EqpID":"EQP25","EqpName":"","State":"Lazy","StartTime":"637029868876322448","ElapsedTime":"601292786421"},{"ID":"1","EqpID":"EQP01","EqpName":"","State":"Lazy","StartTime":"637030450508309313","ElapsedTime":"0"},{"ID":"1","EqpID":"DOCK","EqpName":"Final Storage","State":"Full","StartTime":"637030458700309128","ElapsedTime":"0"},{"ID":"1","EqpID":"EQP02","EqpName":"","State":"Lazy","StartTime":"637030514405907870","ElapsedTime":"0"},{"ID":"1","EqpID":"EQP07","EqpName":"","State":"Lazy","StartTime":"637030514405907870","ElapsedTime":"0"},{"ID":"1","EqpID":"EQP03","EqpName":"","State":"Lazy","StartTime":"637030540620307278","ElapsedTime":"0"},{"ID":"1","EqpID":"EQP06","EqpName":"","State":"Lazy","StartTime":"637030540620307278","ElapsedTime":"0"}]'),
    //     snapshotjson: [
    //         {
    //             "updatedat":"2019-09-10 13:00:00", 
    //             rows:[
    //                 {"objid":"EQP01", "part":"DQ", "targetobjid1":"PROD01_01"},
    //                 {"objid":"EQP01", "part":"DQ", "targetobjid1":"PROD01_02"},
    //                 {"objid":"EQP01", "part":"PROC", "targetobjid1":"PROD01_03"},
    //                 {"objid":"EQP01", "part":"WQ", "targetobjid1":"PROD01_01"},
    //                 {"objid":"EQP01", "part":"WQ", "targetobjid1":"PROD01_02"},
    //                 {"objid":"EQP01", "part":"WQ", "targetobjid1":"PROD01_03"},
    //                 {"objid":"EQP01", "part":"WQ", "targetobjid1":"PROD01_04"},
    //                 {"objid":"EQP02", "part":"DQ", "targetobjid1":"PROD01_03"},
    //                 {"objid":"EQP02", "part":"PROC", "targetobjid1":"PROD01_03"},
    //                 {"objid":"EQP02", "part":"PROC", "targetobjid1":"PROD01_04"},
    //                 {"objid":"EQP02", "part":"WQ", "targetobjid1":"PROD01_01"},
    //                 {"objid":"EQP03", "part":"DQ", "targetobjid1":"PROD01_05"},
    //                 {"objid":"EQP03", "part":"DQ", "targetobjid1":"PROD01_06"}
    //             ]
    //         },
    //         {
    //             "updatedat":"2019-09-10 14:00:00", 
    //             rows:[
    //                 {"objid":"EQP01", "part":"DQ", "targetobjid1":"PROD01_01"},
    //                 {"objid":"EQP01", "part":"DQ", "targetobjid1":"PROD01_02"},
    //                 {"objid":"EQP01", "part":"PROC", "targetobjid1":"PROD01_03"},
    //                 {"objid":"EQP01", "part":"WQ", "targetobjid1":"PROD01_01"},
    //                 {"objid":"EQP01", "part":"WQ", "targetobjid1":"PROD01_02"},
    //                 {"objid":"EQP01", "part":"WQ", "targetobjid1":"PROD01_03"},
    //                 {"objid":"EQP01", "part":"WQ", "targetobjid1":"PROD01_04"},
    //                 {"objid":"EQP02", "part":"DQ", "targetobjid1":"PROD01_03"},
    //                 {"objid":"EQP02", "part":"PROC", "targetobjid1":"PROD01_03"},
    //                 {"objid":"EQP02", "part":"PROC", "targetobjid1":"PROD01_04"},
    //                 {"objid":"EQP02", "part":"WQ", "targetobjid1":"PROD01_01"},
    //                 {"objid":"EQP03", "part":"DQ", "targetobjid1":"PROD01_05"},
    //                 {"objid":"EQP03", "part":"DQ", "targetobjid1":"PROD01_06"}
    //             ]
    //         }
    //     ]
    // });
    //socket.emit('SetObjPropVal', {applid: 'SAPS', objid:'EQP02', classid:'E201010', propid: 'PRESET', propval: 'PRESET07'});
    //socket.emit('GetClassDetail', {classid:'PROD01'});
    //socket.emit('GetSite', {applid:'SAPS'});
    //socket.emit('GetPropValue', {propid:'PRESET'});
    //socket.emit('StartMonitoringData', {applid: 'SAPS', interval: 500});
    //socket.emit('GetClass', {applid: 'SAPS', parentclassid: null});
    //socket.emit('GetSnapshotwip', {resultid: 326, snapshotid: 1});
    //socket.emit('GetClassDetail', {classid: 'PS0122'});
    //socket.emit('StopMonitoringData');
});
socket.on('event', function(data){});
socket.on('disconnect', function(){});
socket.on("ResultGetClassDetail", function (data) {
    console.log(util.inspect(data, {showHidden: false, depth: null}));
});
socket.on("ResultGetSite", function (data) {
    console.log(util.inspect(data, {showHidden: false, depth: null}));
});


socketSaps.on('connect', function(){
    var data = { 
        eqp_id: 'EQP01',
        rows: null//[
            //{product_id:'PROD01_01', process_id:'PROC01_01', step_id: 'STEP01'},
            //{product_id:'PROD01_02', process_id:'PROC01_03', step_id: 'STEP01'} 
        //]
    }
    //socketSaps.emit('GetVersion');
    //socketSaps.emit('UpdateEqpArrange', data);
    //socketSaps.emit('GetProduct', {eqp_id: 'EQP01'});
    socketSaps.emit('GetOrder', {version_no: 'TSK-20190916-120731'});
    //socketSaps.emit('UpdateEquipmentPreset', {eqp_id: 'EQP01', preset_id: 'PRESET03'});
});
socketSaps.on('event', function(data){});
socketSaps.on('disconnect', function(){});
socketSaps.on("ResultGetVersion", function (data) {
    console.log(util.inspect(data, {showHidden: false, depth: null}));
});
socketSaps.on("ResultGetProduct", function (data) {
    console.log(util.inspect(data, {showHidden: false, depth: null}));
});

//socket.emit('GetClass', {'applid':'FAB0', 'parentclassid':'ROOT'});
//socket.emit('GetClass', {'applid':'FAB0', 'parentclassid':'E20'});
//socket.emit('ObjectTableInsert');
//socket.emit('ObjectPropInsert');
//socket.emit('GetOrderData');
