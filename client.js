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
        var message = 'EQP0' + Math.floor((Math.random() * 9) + 1);
        message += ':OPERATING:';
        message += (Math.floor(Math.random() * 2) == 0) ? 'Y' : 'N';
        console.log(message);
        redisClient.publish(OBJECT_STATUS_CHANNEL, message);
        message = 'EQP0' + Math.floor((Math.random() * 9) + 1);
        message += ':DQWIP:' + Math.floor((Math.random() * 10) + 1);
        console.log(message);
        redisClient.publish(OBJECT_STATUS_CHANNEL, message);
        timeout();
    }, 10);
}
//timeout();
//console.log('IOT Finished!!');

socket.on('connect', function(){
    //socket.emit('GetObject');
    //socket.emit('GetResultDetail', {resultid: '1'});
    socket.emit('GetObject', {applid:'FAB0'});
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
