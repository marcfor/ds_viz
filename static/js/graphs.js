queue()
    .defer(d3.json, "/data")
    .await(makeGraphs);

function makeGraph(name, records) {
	var ndx = crossfilter(records);
    var dateDim = ndx.dimension(function(d) { return d.timestamp; });
    var dateGroup = dateDim.group().reduceSum(function(d) {return d.count;});

	var minDate = dateDim.bottom(1)[0]["timestamp"];
//	minDate.setDate(minDate.getDate() - 1/120);
	var maxDate = dateDim.top(1)[0]["timestamp"];
//	maxDate.setDate(maxDate.getDate() + 1/120);

    var dsDim = ndx.dimension(function(d) {return d.data_source});
    dsDim.filter(name);
    var chart = dc.barChart('#' + name);
    chart
        .width(650)
        .height(140)
        .margins({top: 10, right: 50, bottom: 20, left: 50})
        .dimension(dateDim)
        .group(dateGroup)
        .transitionDuration(500)
        .x(d3.time.scale().domain([minDate, maxDate]))
        .elasticY(true)
        .yAxis().ticks(4);
    chart.render();
}

function makeGraphs(error, recordsJson) {
	//Clean data
	var records = recordsJson;
	var dateFormat = d3.time.format("%Y-%m-%d");

	var data_sources = {};

	records.forEach(function(d) {
		d["timestamp"] = dateFormat.parse(d["timestamp"]);
		d["timestamp"].setMinutes(0);
		d["timestamp"].setSeconds(0);
		data_sources[d.data_source] = true;
	});

    //Charts
    Object.keys(data_sources).sort().forEach(function(d) { makeGraph(d, records)});
};