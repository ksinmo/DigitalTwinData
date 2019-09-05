const util = require('util')
//var socket = require('socket.io-client')('http://localhost:8071');
var socket = require('socket.io-client')('http://portal.tobeway.com:1814');
//var socket = require('socket.io-client')('http://mdmcloud.tobeway.com:8071');
//var socket = require('socket.io-client')('ws://127.0.0.1:999/socket.io/?EIO=4&transport=websocket');
//const redis = require('redis');
//var redisClient = redis.createClient(6379, 'mdmcloud.tobeway.com');

var socketSaps = require('socket.io-client')('http://localhost:8072');
//var socketSaps = require('socket.io-client')('http://portal.tobeway.com:1813'); //1813 -> 8072

socket.on('connect', function(){
    // socket.emit('InsertResult', 
    // {usrid: 'ksm',
    // applid: 'SAPS',
    // scenarioid: 'TSK-20190828-174438',
    // resultname: 'TSK-20190828-174438 Result',
    // updatedat: '2019-09-02 05:14:14',
    // wipjson: JSON.parse('[{"objname":"황삭","DQ":0,"PROC":0,"WQ":0},{"objname":"1차조립01","DQ":0,"PROC":0,"WQ":0},{"objname":"정삭01","DQ":0,"PROC":0,"WQ":0},{"objname":"정삭02","DQ":0,"PROC":0,"WQ":0},{"objname":"1차조립02","DQ":0,"PROC":0,"WQ":0},{"objname":"2차조립","DQ":0,"PROC":0,"WQ":0},{"objname":"최종","DQ":0,"PROC":0,"WQ":0},{"objname":"Inital Storage","DQ":0,"PROC":0,"WQ":0},{"objname":"Final Storage","DQ":0,"PROC":46,"WQ":0}]'),
    // performancejson: JSON.parse('[{"objname":"황삭","PRODUCT01":0,"PRODUCT02":0,"PRODUCT03":0},{"objname":"1차조립01","PRODUCT01":0,"PRODUCT02":0,"PRODUCT03":0},{"objname":"정삭01","PRODUCT01":0,"PRODUCT02":0,"PRODUCT03":0},{"objname":"정삭02","PRODUCT01":0,"PRODUCT02":0,"PRODUCT03":0},{"objname":"1차조립02","PRODUCT01":0,"PRODUCT02":0,"PRODUCT03":0},{"objname":"2차조립","PRODUCT01":0,"PRODUCT02":0,"PRODUCT03":0},{"objname":"최종","PRODUCT01":0,"PRODUCT02":0,"PRODUCT03":0},{"objname":"Inital Storage","PRODUCT01":0,"PRODUCT02":0,"PRODUCT03":0},{"objname":"Final Storage","PRODUCT01":0,"PRODUCT02":0,"PRODUCT03":0}]'),
    // alertjson: JSON.parse('[{"objid":"EQP07","objname":"EQP07","STATE":"Busy","COUNT":6,"ELAPSED":"337510400000"},{"objid":"EQP07","objname":"EQP07","STATE":"Lazy","COUNT":1,"ELAPSED":"288358400000"},{"objid":"EQP06","objname":"EQP06","STATE":"Busy","COUNT":6,"ELAPSED":"411238400000"},{"objid":"EQP06","objname":"EQP06","STATE":"Lazy","COUNT":1,"ELAPSED":"262144000000"},{"objid":"EQP17","objname":"EQP17","STATE":"Busy","COUNT":1,"ELAPSED":"18022400000"},{"objid":"EQP21","objname":"EQP21","STATE":"Busy","COUNT":2,"ELAPSED":"36044800000"},{"objid":"EQP23","objname":"EQP23","STATE":"Lazy","COUNT":1,"ELAPSED":"1638400000"},{"objid":"EQP26","objname":"EQP26","STATE":"Lazy","COUNT":1,"ELAPSED":"19660800000"},{"objid":"EQP25","objname":"EQP25","STATE":"Lazy","COUNT":1,"ELAPSED":"675020800000"},{"objid":"EQP01","objname":"EQP01","STATE":"Lazy","COUNT":1,"ELAPSED":"352256000000"},{"objid":"DOCK","objname":"Final Storage","STATE":"Full","COUNT":1,"ELAPSED":"306380800000"},{"objid":"EQP02","objname":"EQP02","STATE":"Lazy","COUNT":1,"ELAPSED":"288358400000"},{"objid":"EQP03","objname":"EQP03","STATE":"Lazy","COUNT":1,"ELAPSED":"262144000000"}]'),
    // alertdetailjson: JSON.parse('[{"ID":"1","EqpID":"EQP07","EqpName":"","State":"Busy","StartTime":"637027642290772731","ElapsedTime":"4915199889"},{"ID":"1","EqpID":"EQP06","EqpName":"","State":"Busy","StartTime":"637027647205972620","ElapsedTime":"57343998705"},{"ID":"2","EqpID":"EQP07","EqpName":"","State":"Busy","StartTime":"637027704549971325","ElapsedTime":"32767999260"},{"ID":"2","EqpID":"EQP06","EqpName":"","State":"Busy","StartTime":"637027732402770696","ElapsedTime":"62259198594"},{"ID":"3","EqpID":"EQP07","EqpName":"","State":"Busy","StartTime":"637027737317970585","ElapsedTime":"90111997965"},{"ID":"3","EqpID":"EQP06","EqpName":"","State":"Busy","StartTime":"637027794661969290","ElapsedTime":"90111997965"},{"ID":"1","EqpID":"EQP17","EqpName":"","State":"Busy","StartTime":"637027974885965220","ElapsedTime":"18022399593"},{"ID":"1","EqpID":"EQP21","EqpName":"","State":"Busy","StartTime":"637027974885965220","ElapsedTime":"18022399593"},{"ID":"4","EqpID":"EQP07","EqpName":"","State":"Busy","StartTime":"637028889113144574","ElapsedTime":"57343998705"},{"ID":"4","EqpID":"EQP06","EqpName":"","State":"Busy","StartTime":"637028946457143279","ElapsedTime":"27852799371"},{"ID":"5","EqpID":"EQP07","EqpName":"","State":"Busy","StartTime":"637028974309942650","ElapsedTime":"62259198594"},{"ID":"5","EqpID":"EQP06","EqpName":"","State":"Busy","StartTime":"637028979225142539","ElapsedTime":"85196798076"},{"ID":"6","EqpID":"EQP07","EqpName":"","State":"Busy","StartTime":"637029036569141244","ElapsedTime":"90111997965"},{"ID":"6","EqpID":"EQP06","EqpName":"","State":"Busy","StartTime":"637029064421940615","ElapsedTime":"88473598002"},{"ID":"1","EqpID":"EQP23","EqpName":"","State":"Lazy","StartTime":"637029703397926185","ElapsedTime":"18022399593"},{"ID":"2","EqpID":"EQP21","EqpName":"","State":"Busy","StartTime":"637029703397926185","ElapsedTime":"18022399593"},{"ID":"1","EqpID":"EQP26","EqpName":"","State":"Lazy","StartTime":"637029793509924150","ElapsedTime":"18022399593"},{"ID":"1","EqpID":"EQP25","EqpName":"","State":"Lazy","StartTime":"637029796786724076","ElapsedTime":"673382384793"},{"ID":"1","EqpID":"EQP01","EqpName":"","State":"Lazy","StartTime":"637030414463510127","ElapsedTime":"0"},{"ID":"1","EqpID":"DOCK","EqpName":"Final Storage","State":"Full","StartTime":"637030458700309128","ElapsedTime":"0"},{"ID":"1","EqpID":"EQP02","EqpName":"","State":"Lazy","StartTime":"637030478361108684","ElapsedTime":"0"},{"ID":"1","EqpID":"EQP07","EqpName":"","State":"Lazy","StartTime":"637030478361108684","ElapsedTime":"0"},{"ID":"1","EqpID":"EQP03","EqpName":"","State":"Lazy","StartTime":"637030504575508092","ElapsedTime":"0"},{"ID":"1","EqpID":"EQP06","EqpName":"","State":"Lazy","StartTime":"637030504575508092","ElapsedTime":"0"}]')
    // });
    //socket.emit('GetClassProp', {classid: 'PROD01'});
    //socket.emit('DeleteResult', {applid:'49'});
});
socket.on('event', function(data){});
socket.on('disconnect', function(){});
socket.on("ResultGetClassProp", function (data) {
    console.log(util.inspect(data, {showHidden: false, depth: null}));
});


socketSaps.on('connect', function(){
    var data = { 
        eqp_id: 'EQP01',
        rows: [
            {product_id:'PROD01_01', process_id:'PROC01_01', step_id: 'STEP01'},
            {product_id:'PROD01_02', process_id:'PROC01_02', step_id: 'STEP01'} 
        ]
    }
    //socketSaps.emit('UpdateEqpArrange', data);
    //socketSaps.emit('GetProduct');
    //socketSaps.emit('GetOrder', {version_no: 'TSK-20190828-174438'});
    socketSaps.emit('UpdateEquipmentPreset', {eqp_id: 'EQP01', preset_id: 'PRESET02'});
});
socketSaps.on('event', function(data){});
socketSaps.on('disconnect', function(){});
socketSaps.on("ResultGetProduct", function (data) {
    console.log(util.inspect(data, {showHidden: false, depth: null}));
});

//socket.emit('GetClass', {'applid':'FAB0', 'parentclassid':'ROOT'});
//socket.emit('GetClass', {'applid':'FAB0', 'parentclassid':'E20'});
//socket.emit('ObjectTableInsert');
//socket.emit('ObjectPropInsert');
//socket.emit('GetOrderData');
