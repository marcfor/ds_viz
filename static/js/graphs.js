queue()
    .defer(d3.json, "/data")
    .await(makeGraphs);

function graphFilter(group, graph){
    return {
        all:function () {
            return group.all().filter(function(d) {
                if (d.key[2] == graph) { return d.value; };
            });
        },
        maxVal:function () {
            var max = Number.MIN_SAFE_INTEGER;
            group.all().forEach(function(d) { if(d.value > max) { max = d.value; } })
            return max;
        },
        minVal:function () {
            var min = Number.MAX_SAFE_INTEGER;
            group.all().forEach(function(d) { if(d.value < min) { min = d.value; } })
            return min;
        }
    };
};

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

	var ndx = crossfilter(records);
    var dateDim = ndx.dimension(function(d) { return [d.timestamp, d.data_source, d.graph]; });
    var dateGroup = dateDim.group().reduceSum(function(d) { return d.count; });

	var minDate = dateDim.bottom(1)[0]["timestamp"];
//	minDate.setDate(minDate.getDate() - 1/120);
	var maxDate = dateDim.top(1)[0]["timestamp"];
//	maxDate.setDate(maxDate.getDate() + 1/120);

    //Charts
    Object.keys(graphs).sort().forEach(function(aGraph) {
        var filteredDateGroup = graphFilter(dateGroup, aGraph);
//        var minCount = filteredDateGroup.bottom(1)[0]["count"];
//        var maxCount = filteredDateGroup.top(1)[0]["count"];
        console.log(filteredDateGroup.minVal());
        var chart = dc.seriesChart("#" + aGraph);
        chart
            .width(500)
            .height(300)
            .margins({top: 20, right: 50, bottom: 50, left: 50})
            .chart(function(c) { return dc.lineChart(c).interpolate('cardinal'); })
            .dimension(dateDim)
            .group(filteredDateGroup)
    //        .childOptions ({ renderDataPoints: {radius: 20, fillOpacity: 0.8, strokeOpacity: 0.8} })
            .yAxisLabel("Documents")
            .xAxisLabel("Date of reading")
            .xAxisPadding(350)
            .x(d3.time.scale().domain([minDate, maxDate]))
            .y(d3.scale.linear().domain([filteredDateGroup.minVal(), filteredDateGroup.maxVal()]))
            .elasticY(true)
            .yAxis().ticks(4);
        chart.seriesAccessor(function(d) {return d.key[1];})
            .keyAccessor(function(d) {return +d.key[0];})
            .valueAccessor(function(d) {return +d.value;})
            .legend(dc.legend().x(20).y(0).itemHeight(13).gap(5).itemWidth(250).horizontal(1));
        chart.render();
    });
};