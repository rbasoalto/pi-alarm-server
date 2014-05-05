var express = require('express');
var app = express();
app.configure(function() {
  app.use(express.bodyParser());
  app.use(express.cookieParser());
});
app.enable('trust proxy');

var longPollClients = [];
var longPollGarbageCollector = function(client) {
  return (function() {
    console.log('Removing client from long polling pool.');
    var idx = longPollClients.indexOf(client);
    // If I'm still on the pool, remove myself
    if (idx >= 0) {
      longPollClients.splice(idx, 1);
    }
  });
};

app.get('/alarm', function(req, res) {
  // Add it to the long polling pool
  var client = {req:req, res:res};
  longPollClients.push(client);
  console.log('Added client to long polling pool.');
  
  // Do the garbage collection when sockets are closed
  res.on('close', longPollGarbageCollector(client));
  res.on('finish', longPollGarbageCollector(client));
});

app.post('/alarm', function(req, res) {
  if (req.body.value !== undefined) {
    console.log('Publising "'+req.body+'" to all clients.');
    longPollClients.forEach(function(client) {
      console.log('Publising "'+req.body+'" to one client.');
      client.res.json(req.body);
    });
  }
  res.json({status: 'OK'});
});

var server = app.listen(process.env.HTTP_PORT || 3000, function() {
    console.log('Listening on port %d', server.address().port);
});