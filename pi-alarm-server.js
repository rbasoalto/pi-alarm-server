var fs = require('fs');
var express = require('express');
var mqtt = require('mqtt');
var app = express();
app.configure(function() {
  app.use(express.bodyParser());
  app.use(express.cookieParser());
});
app.enable('trust proxy');

var config = {
  mqttClientOpts: {},
  mqttPort: 1883,
  mqttHost: 'localhost',
  mqttCommandsTopic: '/alarm/commands',
  mqttStateTopic: '/alarm/state',
  turnOffDelay: 10000
};

// Read configfile
if (process.argv.length > 2) {
  console.log('Parsing config file: '+process.argv[2]);
  var data = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
  for (var key in data) {
    config[key] = data[key];
  }
}

var lastKnownState = {};

var mqttClient = mqtt.createClient(config['mqttPort'], config['mqttHost'], config['mqttClientOpts']);

mqttClient
  .subscribe(config['mqttStateTopic'])
  .on('message', function(topic, message) {
    if (topic == config['mqttStateTopic']) {
      lastKnownState = JSON.parse(message);
    }
  });


app.get('/alarm', function(req, res) {
  res.json({status: 'OK', lastKnownState: lastKnownState});
});

app.post('/alarm', function(req, res) {
  if (req.body.value !== undefined) {
    var payload = {value: req.body.value};
    if (req.body.timeout !== undefined) {
      payload['timeout'] = req.body.timeout;
    }
    payload = JSON.stringify(payload);
    console.log('Publising \''+payload+'\' to all clients.');
    mqttClient.publish(config['mqttCommandsTopic'], payload, {qos: 1});
  }
  res.json({status: 'OK', lastKnownState: lastKnownState});
});

var server = app.listen(process.env.HTTP_PORT || 3000, function() {
    console.log('Listening on port %d', server.address().port);
});