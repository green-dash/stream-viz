
var socket = io.connect();


var selectedTopic = "normalized-by-tag-topic"

var m = 0;

var speedFactor = 1;

socket.on("speedFactor", function (data){
    speedFactor = data;
    $( "#speedValue" ).val( data );
    $( "#speedFactor" ).slider( "value", data );
});

$(function() {

    $( "#speedFactor" ).slider({
        range: "max",
        min: 1,
        max: 100,
        value: $( "#speedValue" ).val(),
        slide: function( event, ui ) {
            $( "#speedValue" ).val( ui.value );
        },
        stop: function( event, ui ) {
            socket.emit("setSpeedFactor", $( "#speedValue" ).val());
        }
    });
    $( "#speedValue" ).val( $( "#speedFactor" ).slider( "value" ) );
});



// var palette = new Rickshaw.Color.Palette( { scheme: 'classic9' } );

var palette = ['#fff7fb','#ece7f2','#d0d1e6','#a6bddb','#74a9cf','#3690c0','#0570b0','#034e7b'].reverse();

var sensors = [
    "FIC_0805_OUT_x_H2O",
    "FIC_0806_OUT_x_H2O",
    "FIC_0899_OUT_x_H2O",
    "FIC_6913_OUT_Train 4_RM",
    "FIC_6924_OUT_Train 4_RM",
    "FIC_6910_OUT_Train 4_RM",
    "AIC_9680_OUT_Train 1_ED"
];

var seriesData = [ ];
var series = [];
sensors.forEach(function(sensor, i) {
    seriesData.push([]);
    series.push({
        // color: palette.color(),
        color: palette[i],
        data: seriesData[i],
        name: sensor
    });
});

var graph = new Rickshaw.Graph( {
	element: document.getElementById("chart"),
	width: 900,
	height: 500,
	renderer: 'area',
	stroke: true,
	preserve: true,
	series: series
} );

graph.render();

document.getElementById("inputStream").addEventListener("change", function(event){
    rawData = [];
    var e = event.srcElement;
    var v = e.options[e.selectedIndex].value;
    if (v == "Real Values"){
        selectedTopic = "grouped-by-tag-topic";
    }
    if (v == "Normalized Values"){
        selectedTopic = "normalized-by-tag-topic";
    }
    socket.emit("selectedTopic", selectedTopic);
});

var rawData = [];
socket.on("grouped-by-tag-topic", function(message) {
    storeMessage("grouped-by-tag-topic", message);
});

socket.on("normalized-by-tag-topic", function(message) {
    storeMessage("normalized-by-tag-topic", message);
});

function storeMessage(requestedTopic, message) {
    var sensor = message.tag;
    var layerIndex = sensors.indexOf(sensor);
    // rawData[layerIndex] = message.values.slice(0, m);
    rawData[layerIndex] = message.values;
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
	tickFormat: Rickshaw.Fixtures.Number.formatKMBT,
	ticksTreatment: ticksTreatment
} );

yAxis.render();

var controls = new RenderControls( {
	element: document.querySelector('form'),
	graph: graph
} );

// setTimeout( function() { // for debugging
setInterval( function() {

    // number of elements per layer
    var l = speedFactor * 10;
    rawData.forEach(function(row){
        if (row.length < l) l = row.length;
    });
    console.log(l);


    rawData.forEach(function(row, i){
        rawData[i] = row.slice(0, l);
    });

    // sync timestamps on x axis
    var layer = rawData[0];
    var first = layer[0].timestamp;
    var length = layer.length;
    var last = layer[length - 1].timestamp;
    var delta = Math.round((last - first) / length);

    rawData.forEach(function(layer, i){
        layer.forEach(function(tv, j) {
            seriesData[i][j] = { x: first + j * delta, y: tv.value };
        });
    });

	document.getElementById("timebox").innerHTML = new Date(last).toString();
	graph.update();

}, 1000 );

function previewRangeSlider() {
    if (seriesData[0].length > 0) {
        var preview = new Rickshaw.Graph.RangeSlider( {
            graph: graph,
            element: document.getElementById('preview')
        } );
    }
    else {
        setTimeout(previewRangeSlider, 100);
    }
}

previewRangeSlider();


