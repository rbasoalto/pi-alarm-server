var express = require('express');
var mqtt = require('mqtt');
var app = express();
app.configure(function() {
  app.use(express.bodyParser());
  app.use(express.cookieParser());
});
app.enable('trust proxy');

var config = {
  mqttClientOpts: {
    username: process.env.MQTT_USERNAME,
    password: process.env.MQTT_PASSWORD
  },
  mqttPort: process.env.MQTT_PORT || 1883,
  mqttHost: process.env.MQTT_HOST || 'localhost',
  mqttCommandsTopic: process.env.MQTT_COMMANDS_TOPIC || '/alarm/commands',
  mqttStateTopic: process.env.MQTT_STATE_TOPIC || '/alarm/state',
  turnOffDelay: process.env.TURN_OFF_DELAY || 10000
};

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

var server = app.listen(process.env.PORT || 3000, function() {
    console.log('Listening on port %d', server.address().port);
});

