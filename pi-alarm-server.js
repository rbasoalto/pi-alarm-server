var express = require('express');
var app = express();
app.enable('trust proxy');

var longPollClients = [];

app.get('/alarm', function(req, res) {
  // Add it to the long polling pool
  var client = {req:req, res:res};
  longPollClients.push(client);
  
  // Do the garbage collection when sockets are closed
  res.on('close', function() {
    var idx = longPollClients.indexOf(client);
    // If I'm still on the pool, remove myself
    if (idx >= 0) {
      longPollClients.splice(idx, 1);
    }
  });
});

app.post('/alarm', function(req, res) {
  longPollClients.forEach(function(client) {
    client.res.json({msg: req.body.msg});
  });
  res.json({status: 'OK'});
});

var server = app.listen(process.env.HTTP_PORT || 3000, function() {
    console.log('Listening on port %d', server.address().port);
});