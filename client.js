const util = require('util')
//var socket = require('socket.io-client')('http://localhost:8071');
var socket = require('socket.io-client')('http://mdmcloud.tobeway.com:8071');
//var socket = require('socket.io-client')('ws://127.0.0.1:999/socket.io/?EIO=4&transport=websocket');
//const redis = require('redis');
//var redisClient = redis.createClient(6379, 'mdmcloud.tobeway.com');
const OBJECT_STATUS_CHANNEL = "ObjectStatus";

socket.on('connect', function(){
    //socket.emit('StartMonitoringData', {interval:100});
    socket.emit('StopMonitoringData');
    //socket.emit('GetResultDetail', {resultid: '1'});
    //socket.emit('DeleteResult', {applid:'49'});
});
socket.on('event', function(data){});
socket.on('disconnect', function(){});
//socket.emit('GetEqpPlan');
//socket.emit('test');
socket.on("ResultGetAllObject", function (data) {
    console.log(util.inspect(data, {showHidden: false, depth: null}));
});


//socket.emit('GetClass', {'applid':'FAB0', 'parentclassid':'ROOT'});
//socket.emit('GetClass', {'applid':'FAB0', 'parentclassid':'E20'});
//socket.emit('ObjectTableInsert');
//socket.emit('ObjectPropInsert');
//socket.emit('GetOrderData');
