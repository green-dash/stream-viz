
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
            { topic: "FIC_0805_OUT_x_H2O"  },
            { topic: "FIC_0806_OUT_x_H2O"  },
            { topic: "FIC_6924_OUT_Train-4_RM"  },
            { topic: "FIC_6913_OUT_Train-4_RM"  }
            // { topic: "AIC_9680_OUT_Train-1_ED"  }
        ]
    );

var webServerPort = configuration["http.port"] || 3010;

consumer.on('message', function (message) {
    // app.io.sockets.emit(message.topic, message.value);
    app.io.sockets.emit(message.topic, JSON.parse(message.value));
    console.log(message);
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

