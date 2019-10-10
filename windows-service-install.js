var Service = require('node-windows').Service;

var svc2 = new Service({
  name:'Digital Twin for Smart APS',
  script: require('path').join(__dirname,'smartaps.file.js')
});

// Listen for the "install" event, which indicates the
// process is available as a service.
svc2.on('install',function(){
  svc2.start();
var svc = new Service({
  name:'Digital Twin Data Service',
  script: require('path').join(__dirname,'server.js')
});

svc.install();


});

svc2.install();
