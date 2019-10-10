var Service = require('node-windows').Service;

// Create a new service object
var svc = new Service({
  name:'Digital Twin Data Service',
  script: require('path').join(__dirname,'server.js')
});

// Listen for the "uninstall" event so we know when it's done.
svc.on('uninstall',function(){
  console.log('Uninstall complete.');
  console.log('The service exists: ',svc.exists);
});

// Uninstall the service.
svc.uninstall();

var svc2 = new Service({
  name:'Digital Twin for Smart APS',
  script: require('path').join(__dirname,'smartaps.file.js')
});

// Listen for the "uninstall" event so we know when it's done.
svc2.on('uninstall',function(){
  console.log('Uninstall complete.');
  console.log('The service exists: ',svc.exists);
});

// Uninstall the service.
svc2.uninstall();