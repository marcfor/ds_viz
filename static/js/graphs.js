queue()
    .defer(d3.json, "/data")
    .await(makeGraphs);

function makeGraph(graph, records) {
	var ndx = crossfilter(records);
    var dateDim = ndx.dimension(function(d) { return [d.timestamp, d.data_source]; });
    var dateGroup = dateDim.group().reduceSum(function(d) { return d.count; });

	var minDate = dateDim.bottom(1)[0]["timestamp"];
//	minDate.setDate(minDate.getDate() - 1/120);
	var maxDate = dateDim.top(1)[0]["timestamp"];
//	maxDate.setDate(maxDate.getDate() + 1/120);

    var graphDim = ndx.dimension(function(d) { return d.graph });
    graphDim.filter(graph);

    var chart = dc.seriesChart("#" + graph);
    chart
        .width(650)
        .height(480)
        .margins({top: 10, right: 150, bottom: 50, left: 50})
        .chart(function(c) { return dc.lineChart(c).interpolate('cardinal'); })
        .dimension(dateDim)
        .group(dateGroup)
//        .transitionDuration(500)
        .yAxisLabel("Documents")
        .xAxisLabel("Date of reading")
        .x(d3.time.scale().domain([minDate, maxDate]))
        .elasticY(true)
        .yAxis().ticks(4);
    chart.seriesAccessor(function(d) {return "timestamp: " + d.key[1];})
        .keyAccessor(function(d) {return +d.key[0];})
        .valueAccessor(function(d) {return +d.value;})
        .legend(dc.legend().x(550).y(50).itemHeight(13).gap(5).horizontal(1).legendWidth(140).itemWidth(70));
    chart.render();
}

function makeGraphs(error, recordsJson) {
	//Clean data
	var records = recordsJson;
	var dateFormat = d3.time.format("%Y-%m-%d");

	var graphs = {};

	records.forEach(function(d) {
		d["timestamp"] = dateFormat.parse(d["timestamp"]);
		d["timestamp"].setMinutes(0);
		d["timestamp"].setSeconds(0);
		graphs[d.graph] = true;
	});

    //Charts
    Object.keys(graphs).sort().forEach(function(d) { makeGraph(d, records)});
};