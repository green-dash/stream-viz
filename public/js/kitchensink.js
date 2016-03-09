
var socket = io.connect();
var m = 100;

var palette = new Rickshaw.Color.Palette( { scheme: 'classic9' } );

// var palette = ['#fff7fb','#ece7f2','#d0d1e6','#a6bddb','#74a9cf','#3690c0','#0570b0','#034e7b'].reverse();

var sensors = [
    "FIC_0805_OUT_x_H2O",
    "FIC_0806_OUT_x_H2O",
    "FIC_6924_OUT_Train 4_RM",
    "FIC_6913_OUT_Train 4_RM",
    "AIC_9680_OUT_Train 1_ED",
    "FIC_0899_OUT_x_H2O",
    "FIC_6910_OUT_Train 4_RM"
];

var seriesData = [ ];
var series = [];
sensors.forEach(function(sensor, i) {
    seriesData.push([]);
    series.push({
        color: palette.color(),
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

var rawData = [];
socket.on("stream-graph-topic", function(message) {
    var sensor = message.tag;
    var layerIndex = sensors.indexOf(sensor);
    rawData[layerIndex] = message.values.slice(0, m);
});

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

var xAxis = new Rickshaw.Graph.Axis.Time( {
	graph: graph,
	ticksTreatment: ticksTreatment,
	timeFixture: new Rickshaw.Fixtures.Time.Local()
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

setInterval( function() {
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

	graph.update();
}, 1000 );

function preViewX() {
    if (seriesData[0].length > 0) {
        var preview = new Rickshaw.Graph.RangeSlider( {
            graph: graph,
            element: document.getElementById('preview')
        } );
        console.log(preview);
    }
    else {
        setTimeout(preViewX, 100);
    }
}

preViewX();

var previewXAxis = new Rickshaw.Graph.Axis.Time({
    // graph: preview.previews[0],
    graph: graph,
    timeFixture: new Rickshaw.Fixtures.Time.Local(),
    ticksTreatment: ticksTreatment
});
previewXAxis.render();

