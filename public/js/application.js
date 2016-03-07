var socket = io.connect();

var n = 8;

var rawData = [];
for (i=0; i < n; i++) {
    rawData[i] = [];
}

var m = 100;

socket.on('FIC_0805_OUT_x_H2O', function(message) {
    var layerIndex = 0;
    rawData[layerIndex].push(message.value);
    if (rawData[layerIndex].length > m) rawData[layerIndex].shift();
});

socket.on('FIC_0806_OUT_x_H2O', function(message) {
    var layerIndex = 1;
    rawData[layerIndex].push(message.value);
    if (rawData[layerIndex].length > m) rawData[layerIndex].shift();
});

socket.on('FIC_6924_OUT_Train-4_RM', function(message) {
    var layerIndex = 2;
    rawData[layerIndex].push(message.value);
    if (rawData[layerIndex].length > m) rawData[layerIndex].shift();
});

socket.on('FIC_6913_OUT_Train-4_RM', function(message) {
    var layerIndex = 3;
    rawData[layerIndex].push(message.value);
    if (rawData[layerIndex].length > m) rawData[layerIndex].shift();
});
socket.on('AIC_9680_OUT_Train-1_ED', function(message) {
    var layerIndex = 4;
    rawData[layerIndex].push(message.value);
    if (rawData[layerIndex].length > m) rawData[layerIndex].shift();
});
socket.on('FIC_0899_OUT_x_H2O', function(message) {
    var layerIndex = 5;
    rawData[layerIndex].push(message.value);
    if (rawData[layerIndex].length > m) rawData[layerIndex].shift();
});
socket.on('FIC_6910_OUT_Train-4_RM', function(message) {
    var layerIndex = 6;
    rawData[layerIndex].push(message.value);
    if (rawData[layerIndex].length > m) rawData[layerIndex].shift();
});
socket.on('FIC_6913_OUT_Train-4_RM', function(message) {
    var layerIndex = 7;
    rawData[layerIndex].push(message.value);
    if (rawData[layerIndex].length > m) rawData[layerIndex].shift();
});


var width = 960, height = 500;
var svg = d3.select('body')
    .append('svg')
    .attr({
        'width': width,
        'height': height
    })
    ;

svg.append("rect")
    .attr("width", "100%")
    .attr("height", "100%")
    .attr("fill", "black");

var xScale = d3.scale.linear()
    .domain([0, m - 1])
    .range([0, width]);

// var color = d3.scale.linear().range(["#aad", "#556"]); //grey`
var color = d3.scale.linear().range(["#e0f3db", "#43a2ca"]); // greenish
// var color = d3.scale.linear().range(["#ffffe5", "#8c2d04"]); // earth
// var color = d3.scale.linear().range(["#f7f4f9", "#91003f"]); // pink

show();


function normalize(vector) {
    var v = vector.slice();
    var max = Math.max.apply(Math, v);
    var min = Math.min.apply(Math, v);
    var d = max - min;
    for (i = 0; i < v.length; i++) {
        v[i] = (v[i] - min) / d;
    }
    return (v);
}

function show() {

    if (rawData.length < n) {
        setTimeout(show, 100);
        return;
    }

    var data = Array();
    d3.map(rawData, function (d, i) {
        data[i] = normalize(d).map(function (i, j) {
            return { x: j, y: i };
        });
    });

    var layers = d3.layout.stack()
        .offset('wiggle')(data);

    console.log(layers);

    var yScale = d3.scale.linear()
        .domain([
            0, d3.max(layers, function (layer) {
                return d3.max(layer, function (d) {
                    return d.y0 + d.y;
                });
            })
        ])
        .range([height, 0]);

    // var axis = d3.svg.axis().orient("left").scale(yScale);
    // svg.call(axis);

    var area = d3.svg.area()
        .interpolate("basis")
        .x(function (d) { return xScale(d.x); })
        .y0(function (d) { return yScale(d.y0); })
        .y1(function (d) { return yScale(d.y0 + d.y); });

    svg.selectAll('path')
    .data(layers)
    .enter()
    .append('path')
    .attr('d', area)
    .style('fill', function () {
        return color(Math.random());
    });

    setTimeout(transition, 1000);

}

function transition() {

    var data = Array();
    d3.map(rawData, function (d, i) {
        data[i] = normalize(d).map(function (i, j) {
            return { x: j, y: i };
        });
    });

    var layers = d3.layout.stack()
        .offset('wiggle')(data);

    var yScale = d3.scale.linear()
        .domain([
            0, d3.max(layers, function (layer) {
                return d3.max(layer, function (d) {
                    return d.y0 + d.y;
                });
            })
        ])
        .range([height, 0]);

    var area = d3.svg.area()
        .interpolate("basis")
        .x(function (d) { return xScale(d.x); })
        .y0(function (d) { return yScale(d.y0); })
        .y1(function (d) { return yScale(d.y0 + d.y); });

    d3.selectAll("path")
        .data(layers)
        .interrupt()
        .transition()
        .ease("linear")
        .duration(1250)
        .attr("d", area)
        ;

    setTimeout(transition, 1250);

}
