const util = require('util')
var socket = require('socket.io-client')('http://localhost:8071');
//var socket = require('socket.io-client')('http://mdmcloud.tobeway.com:8071');
//var socket = require('socket.io-client')('ws://127.0.0.1:999/socket.io/?EIO=4&transport=websocket');
const redis = require('redis');
var redisClient = redis.createClient(6379, 'mdmcloud.tobeway.com');
const OBJECT_STATUS_CHANNEL = "ObjectStatus";

///Generate IoT Sensor
function timeout() {
    setTimeout(function () {
        var eqp = 'EQP0' + Math.floor((Math.random() * 9) + 1);
        var processingWIP = Math.floor((Math.random() * 3));
        var message = eqp + ':OPERATING:';
        message += (processingWIP > 0) ? 'Y' : 'N';
        console.log(message);
        redisClient.publish(OBJECT_STATUS_CHANNEL, message);
        message = eqp + ':PROCESSINGWIP:' + processingWIP;
        console.log(message);
        redisClient.publish(OBJECT_STATUS_CHANNEL, message);
        message = eqp + ':DQWIP:' + Math.floor((Math.random() * 10) );
        console.log(message);
        redisClient.publish(OBJECT_STATUS_CHANNEL, message);
        timeout();
    }, 1000);
}
timeout();
//console.log('IOT Finished!!');

socket.on('connect', function(){
    socket.emit('GetObject', {applid:'GSCP0'});
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
