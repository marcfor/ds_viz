queue()
    .defer(d3.json, "/data")
    .await(makeGraphs);

// return a fake group to filter on graph name
function graphFilter(group, graph){
    return {
        all:function () {
            return group.all().filter(function(d) {
                if (d.key[2] == graph) { return d.value; };
            });
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
//		d["timestamp"].setMinutes(0);
//		d["timestamp"].setSeconds(0);
		graphs[d.graph] = true;
	});

	var ndx = crossfilter(records);
    var dateDim = ndx.dimension(function(d) { return [d.timestamp, d.data_source, d.graph]; });
    var dateGroup = dateDim.group().reduceSum(function(d) { return d.count; });

	var minDate = dateDim.bottom(1)[0]["timestamp"];
//	minDate.setDate(minDate.getDate() - 1/120);
	var maxDate = dateDim.top(1)[0]["timestamp"];
//	maxDate.setDate(maxDate.getDate() + 1/120);
    console.log(maxDate);

    //Charts
    Object.keys(graphs).sort().forEach(function(aGraph) {
        var filteredDateGroup = graphFilter(dateGroup, aGraph);
        var minCount = Number.MAX_SAFE_INTEGER;
        var maxCount = Number.MIN_SAFE_INTEGER;
        filteredDateGroup.all().forEach(function(d) {
            minCount = Math.min(minCount, d.value);
            maxCount = Math.max(maxCount, d.value);
        });
        var fudge = (maxCount + minCount) / 40;
        var chart = dc.seriesChart("#" + aGraph);
        chart
            .width(500)
            .height(300)
            .margins({top: 20, right: 50, bottom: 50, left: 50})
            .chart(function(c) { return dc.lineChart(c); })
            .dimension(dateDim)
            .group(filteredDateGroup)
    //        .childOptions ({ renderDataPoints: {radius: 20, fillOpacity: 0.8, strokeOpacity: 0.8} })
            .yAxisLabel("Documents")
            .xAxisLabel("Date of reading")
            .xAxisPadding(350)
            .x(d3.time.scale().domain([minDate, maxDate]))
            .y(d3.scale.linear().domain([minCount-fudge, maxCount+fudge]))
            .yAxis().ticks(5);
        chart.seriesAccessor(function(d) {return d.key[1];})
            .keyAccessor(function(d) {return +d.key[0];})
            .valueAccessor(function(d) {return +d.value;})
            .legend(dc.legend().x(20).y(0).itemHeight(13).gap(5).itemWidth(250).horizontal(1));
        chart.render();
    });
};