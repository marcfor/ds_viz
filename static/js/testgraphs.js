queue()
    .defer(d3.json, "/data")
    .await(makeGraphs);

function makeGraphs(error, recordsJson) {
	//Clean data
	var records = recordsJson;
	var dateFormat = d3.time.format("%Y-%m-%d");
	var graphHash = {};

	records.forEach(function(d) {
		d["timestamp"] = dateFormat.parse(d["timestamp"]);
		graphHash[d.graph] = true;
	});
	var graphs = Object.keys(graphHash);

	var ndx = crossfilter(records);
	var graphDim = ndx.dimension(function(d) { return d.graph; });
	var dtDim = ndx.dimension(function(d) { return d.timestamp; });
	var maxDate = dtDim.top(1)[0]["timestamp"];
	dtDim.filter([new Date(maxDate).setDate(maxDate.getDate()-8), maxDate]);
	var minDate = dtDim.bottom(1)[0]["timestamp"];
    console.log(maxDate);
    //Charts
    graphs.forEach(function(aGraph) {
        graphDim.filterAll(); // clear the previous filter
        graphDim.filter(aGraph); // filter on the current graph
        var ndx2 = crossfilter(graphDim.top(ndx.size())); // make new ndx with data points for current graph
        var countDim = ndx2.dimension(function(d) { return [d.timestamp, d.data_source]; });
        var countGroup = countDim.group().reduceSum(function(d) { return d.count; })

        // get the highest and lowest document counts on the graph
        var countDim2 = ndx2.dimension(function(d) { return d.count; })
        var minCount = countDim2.bottom(1)[0].count;
        var maxCount = countDim2.top(1)[0].count;

        // fudge is the amount of padding to add above the minCount and maxCount on the graph
        var fudge = (maxCount + minCount) / 40;

        var chart = dc.seriesChart("#" + aGraph);
        chart
            .title(function(d) { return 'x=' + dateFormat(d.key[0]) + ', y=' + d.value; }) // tooltip text
            .brushOn(false) // must be false for the tooltip to work
            .width(document.getElementById(aGraph).parentElement.clientWidth-20)
            .height(150)
            .margins({top: 20, right: 20, bottom: 50, left: 50})
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

        // add colours if problems are detected
        var dtDim2 = ndx2.dimension(function(d) { return d.timestamp; });
        var lastResults = dtDim2.top(2); // get the data points with latest timestamps
        if ((lastResults[0].count == 0) || (lastResults[1].count == 0)) {
            document.getElementById(aGraph).style.backgroundColor = "lightpink";
        } else if (maxCount - minCount > 5) {
            document.getElementById(aGraph).style.backgroundColor = "lightyellow";
        }
    });

    dc.renderAll();
};