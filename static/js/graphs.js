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
		graphs[d.graph] = true;
	});

	var ndx = crossfilter(records);
	var dtDim = ndx.dimension(function(d) { return d.timestamp; });
	var minDate = dtDim.bottom(1)[0]["timestamp"];
//	minDate.setDate(minDate.getDate() - 1/120);
	var maxDate = dtDim.top(1)[0]["timestamp"];
//	maxDate.setDate(maxDate.getDate() + 1/120);

    var dateDim = ndx.dimension(function(d) { return [d.timestamp, d.data_source, d.graph]; });
    var dateGroup = dateDim.group().reduceSum(function(d) { return d.count; });


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
            .title(function(d) { return 'x=' + dateFormat(d.key[0]) + ', y=' + d.value; }) // tooltip text
            .brushOn(false) // must be false for the tooltip to work
            .width(500)
            .height(300)
            .margins({top: 20, right: 50, bottom: 50, left: 50})
            .transitionDuration(0)
            .chart(function(c) { return dc.lineChart(c) .renderDataPoints({radius: 3}); })
            .dimension(dateDim)
            .group(filteredDateGroup)
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
        }
    });

    dc.renderAll();
};