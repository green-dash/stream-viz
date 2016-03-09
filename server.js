
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

var kafka = require('kafka-node'),
    HighLevelConsumer = kafka.HighLevelConsumer,
    client = new kafka.Client(),
    consumer = new HighLevelConsumer( client, [
            { topic: "stream-graph-topic"}
        ]
    );

var webServerPort = configuration["http.port"] || 3010;

consumer.on('message', function (message) {
    var payload = JSON.parse(message.value);
    app.io.sockets.emit("stream-graph-topic", payload);
});

/* start web server */
app.listen(webServerPort, function(){
    console.log('web server listening at 0.0.0.0:%s', webServerPort);
});

/* work around bug in kafka consumer client */
process.on('SIGINT', function() {
    consumer.close(true, function(){
        process.exit();
    })
});

