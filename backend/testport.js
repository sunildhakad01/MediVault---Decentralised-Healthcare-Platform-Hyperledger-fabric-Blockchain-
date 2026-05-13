var s = require('net').createServer();
s.listen(3001, function() {
  console.log('PORT_OK');
  s.close();
});
s.on('error', function(e) {
  console.log('PORT_ERR:' + e.message);
  process.exit(1);
});
