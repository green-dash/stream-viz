
var fs = require('fs');

var configuration = JSON.parse(
    fs.readFileSync("conf/application.json")
);

var request = require("request")
, sprintf = require("sprintf-js").sprintf
, _ = require("lodash");
;

var express = require('express.io');
var app = express();
app.http().io();
app.use(express.static(__dirname + '/public'));

var selectedTopic = "normalized-by-tag-topic";
app.io.route('selectedTopic', function(req) {
    console.log("subscribing to: " + req.data);
    selectedTopic = req.data;
});

var kafka = require('kafka-node'),
    HighLevelConsumer = kafka.HighLevelConsumer;

var kafkaClient = new kafka.Client(),
    kafkaConsumer = new HighLevelConsumer( kafkaClient, [
            { topic: "normalized-by-tag-topic"},
            { topic: "grouped-by-tag-topic"}
        ]
    );

kafkaConsumer.on('message', pushToWebsocket);

function pushToWebsocket(message) {
    if (message.topic == selectedTopic) {
        var payload = JSON.parse(message.value);
        app.io.sockets.emit(message.topic, payload);
    }
}

/* start web server */
var webServerPort = configuration["http.port"] || 3010;
app.listen(webServerPort, function(){
    console.log('web server listening at 0.0.0.0:%s', webServerPort);
});

/* work around bug in kafka consumer client */
process.on('SIGINT', function() {
    kafkaConsumer.close(true, function(){ process.exit(); })
});

