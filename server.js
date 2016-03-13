
var fs = require('fs');

var configuration = JSON.parse(
    fs.readFileSync("conf/application.json")
);

var RestClient = require('node-rest-client').Client;
var restClient = new RestClient();

var request = require("request")
, sprintf = require("sprintf-js").sprintf
, _ = require("lodash");
;

var express = require('express.io');
var app = express();
app.http().io();
app.use(express.static(__dirname + '/public'));

var dataPlayerRestUrl = configuration["data.player.rest.url"]

/* speed factor REST handling: get data */
function getSpeedFactor() {
    restClient.get(dataPlayerRestUrl + "/speed", function (data, response) {
        app.io.sockets.emit('speedFactor', parseInt(data.toString()));
    })
}
setInterval( function() {
    getSpeedFactor();
}, 2000);

/* speed factor REST handling: set data */
app.io.route('setSpeedFactor', function(req) {
    var args = { data: req.data };
    restClient.post(dataPlayerRestUrl + "/speed", args, function (data, response) { })
});

app.io.route('sensorList', function(req) {
    restClient.get(dataPlayerRestUrl + "/sensorList", function (data, response) {
        app.io.sockets.emit('sensorList', JSON.parse(data));
    });
});

var kafka = require('kafka-node'),
    HighLevelConsumer = kafka.HighLevelConsumer,
    kafkaClient = new kafka.Client(),
    kafkaConsumer = new HighLevelConsumer( kafkaClient, [
            { topic: "normalized-by-tag-topic"},
            { topic: "grouped-by-tag-topic"}
        ]
    );

kafkaConsumer.on('message', function (message) {
    var payload = JSON.parse(message.value);
    app.io.sockets.emit(message.topic, payload);
});

/* work around bug in kafka consumer client */
process.on('SIGINT', function() {
    kafkaConsumer.close(true, function(){ process.exit(); })
});

/* start web server */
var webServerPort = configuration["http.port"] || 3010;
app.listen(webServerPort, function(){
    console.log('web server listening at 0.0.0.0:%s', webServerPort);
});


