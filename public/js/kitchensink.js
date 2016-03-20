
var socket = io.connect();
var selectedTopic = "grouped-by-tag-topic"
var m = 0;
var speedFactor = 1;
var deviationLevel = 1;
var sensors = [];
var gaugeData;
var gaugeOptions = {
    width: 900, height: 120,
    max: 50, min: 0,
    redFrom: 45, redTo: 50,
    yellowFrom:35, yellowTo: 45,
    minorTicks: 1,
    majorTicks: ["0", "10", "20", "30", "40", "50"]
};
var gaugeChart;

socket.on("speedFactor", function (data){
    speedFactor = data;
    $( "#speedValue" ).val( data );
    $( "#speedFactor" ).slider( "value", data );
});

$(function() {

    $( "#speedFactor" ).slider({
        range: "max",
        min: 1,
        max: 20,
        value: $( "#speedValue" ).val(),
        slide: function( event, ui ) {
            $( "#speedValue" ).val( ui.value );
        },
        stop: function( event, ui ) {
            socket.emit("setSpeedFactor", $( "#speedValue" ).val());
        }
    });
    $( "#speedValue" ).val( $( "#speedFactor" ).slider( "value" ) );

    $( ".deviationRadio").change(function(v){
        for (i=0; i < gaugeData.getNumberOfRows(); i++) {
            gaugeData.setValue(i, 1, 0);
        }
        gaugeChart.draw(gaugeData, gaugeOptions);
        deviationLevel = + $(this).val();
    });

});

var colorScheme = ['#fff7fb','#ece7f2','#d0d1e6','#a6bddb','#74a9cf','#3690c0','#0570b0','#034e7b'].reverse();

var Palette = function() {
    var i = 0;
    this.color = function () {
        return colorScheme[i++ % colorScheme.length];
    }
}
var palette = new Palette();

/* start doing the real work when we have info from the server */
socket.emit("sensorList");
socket.on("sensorList", function (sensorList){
    sensorList.forEach(function (sensorInfo, i) {
        sensors.push(sensorInfo.tagName);
    });
    google.charts.load('current', {'packages':['gauge']});
    google.charts.setOnLoadCallback(drawGauges);
    doWork();
});

function doWork() {
    var series = [];
    sensors.forEach(function(sensor, i) {
        series.push({
            color: palette.color(),
            data: [],
            name: sensor
        });
    });

    var graph = new Rickshaw.Graph( {
        element: document.getElementById("chart"),
        min: -1,
        width: 900,
        height: 500,
        renderer: 'area',
        stroke: true,
        preserve: true,
        series: series
    });

    graph.render();

    document.getElementById("inputStream").addEventListener("change", function(event){
        rawData = [];
        var i = event.srcElement.selectedIndex;
        switch(i) {
            case 0:
                selectedTopic = "grouped-by-tag-topic";
                graph.configure({min: -1 });
                break;
            case 1:
                selectedTopic = "standardized-by-tag-topic";
                graph.configure({min: -4});
                break;
            case 2:
                selectedTopic = "normalized-by-tag-topic";
                graph.configure({min: 0});
                break;
        }
        socket.emit("selectedTopic", selectedTopic);
    });

    socket.on("grouped-by-tag-topic", function(message) {
        updateGraph("grouped-by-tag-topic", message);
    });

    socket.on("standardized-by-tag-topic", function(message) {
        updateGraph("standardized-by-tag-topic", message);
    });

    socket.on("normalized-by-tag-topic", function(message) {
        updateGraph("normalized-by-tag-topic", message);
    });

    socket.on("deviation-topic", function(message) {
        checkDeviations(message);
    });

    function checkDeviations(deviationMessage){
        deviationMessage.forEach(function(deviation){
            var sensor = deviation.tag;
            var layerIndex = sensors.indexOf(sensor);
            var numDeviations = deviation.deviations[deviationLevel];
            gaugeData.setValue(layerIndex, 1, numDeviations);
        });
        gaugeChart.draw(gaugeData, gaugeOptions);
    }

    function updateGraph(requestedTopic, sensorMessages){
        if (requestedTopic != selectedTopic) return;

        // use timeseries from 1st sensor, so we don't mess up the ui
        var ts = sensorMessages[0].values

        sensorMessages.forEach(function(sensorMessage){
            var sensor = sensorMessage.tag;
            var sensorIndex = sensors.indexOf(sensor);
            graph.series[sensorIndex].data = sensorMessage.values.map(function(tv, i){ return {x: ts[i].timestamp, y: tv.value} });
        });
        graph.update();

        $("#timebox").html(new Date(ts[ts.length - 1].timestamp).toString());
    }

    var hoverDetail = new Rickshaw.Graph.HoverDetail( {
        graph: graph,
        xFormatter: function(x) {
            return new Date(x).toString();
        }
    });

    var annotator = new Rickshaw.Graph.Annotate( {
        graph: graph,
        element: document.getElementById('timeline')
    } );

    var legend = new Rickshaw.Graph.Legend( {
        graph: graph,
        element: document.getElementById('legend')

    } );

    var shelving = new Rickshaw.Graph.Behavior.Series.Toggle( {
        graph: graph,
        legend: legend
    } );

    var order = new Rickshaw.Graph.Behavior.Series.Order( {
        graph: graph,
        legend: legend
    } );

    var highlighter = new Rickshaw.Graph.Behavior.Series.Highlight( {
        graph: graph,
        legend: legend
    } );

    var smoother = new Rickshaw.Graph.Smoother( {
        graph: graph,
        element: document.querySelector('#smoother')
    } );

    var ticksTreatment = 'glow';

    var xAxis = new Rickshaw.Graph.Axis.X( {
        graph: graph,
        ticksTreatment: ticksTreatment,
        tickFormat: function(d) { return new Date(d).toString().match(/(\d+:\d+):/)[1]; }
    } );

    xAxis.render();

    var yAxis = new Rickshaw.Graph.Axis.Y( {
        graph: graph,
        ticksTreatment: ticksTreatment
    } );

    yAxis.render();

    var controls = new RenderControls( {
        element: document.querySelector('form'),
        graph: graph
    } );

    function previewRangeSlider() {
        if (graph.series[0].data.length > 0) {
            var preview = new Rickshaw.Graph.RangeSlider( {
                graph: graph,
                element: document.getElementById('preview')
            } );
        }
        else {
            // wait until graph has data
            setTimeout(previewRangeSlider, 100);
        }
    }
    previewRangeSlider();

}

function drawGauges() {
    var arr = [ ['Label', 'Value'] ];
    sensors.forEach(function(sensor, i){
        arr.push( ["", +0.0] );
    });
    gaugeData = google.visualization.arrayToDataTable(arr);
    gaugeChart = new google.visualization.Gauge(document.getElementById('deviationContainer'));
    gaugeChart.draw(gaugeData, gaugeOptions);

    var row = "";
    sensors.forEach(function(sensor, i){
        row += "<td>" + sensor + "</td>";
    })
    $('#deviationContainer table tr:last').after("<tr>" + row + "</tr>");

}

