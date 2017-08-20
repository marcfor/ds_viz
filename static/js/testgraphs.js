queue()
    .defer(d3.json, "/data")
    .await(makeGraphs);

function toggleGraph(evt, graph) {
    var tab = document.getElementById(graph + '_tab');
    tab.style.borderStyle = (tab.style.borderStyle!=='inset' ? 'inset' : 'outset');
    var graphElement = document.getElementById(graph).parentElement.parentElement;
    graphElement.style.display = (graphElement.style.display !== 'none' ? 'none' : '');
}

function makeGraphs(error, recordsJson) {
	//Clean data
	var records = recordsJson;
	var dateFormat = d3.time.format("%Y-%m-%d");

	var graphs = {};

	records.forEach(function(d) {
		d["timestamp"] = dateFormat.parse(d["timestamp"]);
		graphs[d.graph] = true;
	});

	var ndx = crossfilter(records);
	var graphDim = ndx.dimension(function(d) { return d.graph; });
	var dtDim = ndx.dimension(function(d) { return d.timestamp; });
	var minDate = dtDim.bottom(1)[0]["timestamp"];
//	minDate.setDate(minDate.getDate() - 1/120);
	var maxDate = dtDim.top(1)[0]["timestamp"];
//	maxDate.setDate(maxDate.getDate() + 1/120);

//    //Charts
    Object.keys(graphs).sort().forEach(function(aGraph) {
        graphDim.filterAll();
        graphDim.filter(aGraph);
        var ndx2 = crossfilter(graphDim.top(ndx.size()));
        var countDim = ndx2.dimension(function(d) { return [d.timestamp, d.data_source]; });
        var countGroup = countDim.group().reduceSum(function(d) { return d.count; })
        var minCount = Number.MAX_SAFE_INTEGER;
        var maxCount = Number.MIN_SAFE_INTEGER;
        countGroup.all().forEach(function(d) {
            minCount = Math.min(minCount, d.value);
            maxCount = Math.max(maxCount, d.value);
        });
        var fudge = (maxCount + minCount) / 40;
        var chart = dc.seriesChart("#" + aGraph);
        chart
            .title(function(d) { return 'x=' + dateFormat(d.key[0]) + ', y=' + d.value; }) // tooltip text
            .brushOn(false) // must be false for the tooltip to work
            .width(500)
            .height(200)
            .margins({top: 20, right: 50, bottom: 50, left: 50})
            .transitionDuration(0)
            .chart(function(c) { return dc.lineChart(c) .renderDataPoints({radius: 3}); })
            .dimension(countDim)
            .group(countGroup)
            .seriesAccessor(function(d) { return d.key[1]; })
            .keyAccessor(function(d) { return +d.key[0]; })
            .valueAccessor(function(d) { return +d.value; })
            .legend(dc.legend().x(20).y(0).itemHeight(13).gap(5).itemWidth(250).horizontal(1))
            .yAxisLabel("Documents")
            .xAxisLabel("Date of reading")
            .xAxisPadding(350)
            .x(d3.time.scale().domain([minDate, maxDate]))
            .y(d3.scale.linear().domain([minCount-fudge, maxCount+fudge]))
            .yAxis().ticks(5);
        if (minCount / maxCount < .9) {
            document.getElementById(aGraph).style.backgroundColor = "lightyellow";
            document.getElementById(aGraph+'_tab').style.backgroundColor = "lightyellow";
            toggleGraph(null, aGraph);
        }
    });

    dc.renderAll();
};