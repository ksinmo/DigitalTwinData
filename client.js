const util = require('util')
var socket = require('socket.io-client')('http://localhost:8071');
//var socket = require('socket.io-client')('http://mdmcloud.tobeway.com:8071');
//var socket = require('socket.io-client')('ws://127.0.0.1:999/socket.io/?EIO=4&transport=websocket');
//const redis = require('redis');
//var redisClient = redis.createClient(6379, 'mdmcloud.tobeway.com');

//var socketSaps = require('socket.io-client')('http://localhost:8072');
var socketSaps = require('socket.io-client')('http://portal.tobeway.com:1813'); //1813 -> 8072

socket.on('connect', function(){
    socket.emit('SetObjPropVal', {applid:'FAB0', objid:'DOCK', classid:'E2020', propid:'VOL', propval:66});
    //socket.emit('DeleteResult', {applid:'49'});
});
socket.on('event', function(data){});
socket.on('disconnect', function(){});
socket.on("ResultGetAppl", function (data) {
    console.log(util.inspect(data, {showHidden: false, depth: null}));
});


socketSaps.on('connect', function(){
    //socketSaps.emit('GetOrder', {scenarioid: 'S04'});
    //socket.emit('GetResultDetail', {resultid: '1'});
    //socket.emit('DeleteResult', {applid:'49'});
});
socketSaps.on('event', function(data){});
socketSaps.on('disconnect', function(){});
socketSaps.on("ResultGetOrder", function (data) {
    console.log(util.inspect(data, {showHidden: false, depth: null}));
});

//socket.emit('GetClass', {'applid':'FAB0', 'parentclassid':'ROOT'});
//socket.emit('GetClass', {'applid':'FAB0', 'parentclassid':'E20'});
//socket.emit('ObjectTableInsert');
//socket.emit('ObjectPropInsert');
//socket.emit('GetOrderData');
