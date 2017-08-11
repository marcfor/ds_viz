queue()
    .defer(d3.json, "/data")
    .await(makeGraphs);

function makeGraphs(error, recordsJson) {
//     alert(recordsJson);
	//Clean data
	var records = recordsJson;
	var dateFormat = d3.time.format("%Y-%m-%d");
	
	records.forEach(function(d) {
		d["timestamp"] = dateFormat.parse(d["timestamp"]);
		d["timestamp"].setMinutes(0);
		d["timestamp"].setSeconds(0);
//		alert(d);
	});

	//Create a Crossfilter instance
	var ndx = crossfilter(records);

	//Define Dimensions
	var dateDim = ndx.dimension(function(d) { return d["timestamp"]; });
	var countDim = ndx.dimension(function(d) { return d["timestamp"]; })
	var allDim = ndx.dimension(function(d) {return d;});


	//Group Data
	var numRecordsByDate = dateDim.group();
	var all = ndx.groupAll();


	//Define values (to be used in charts)
	var minDate = dateDim.bottom(1)[0]["timestamp"];
	var maxDate = dateDim.top(1)[0]["timestamp"];


    //Charts
    var numberRecordsND = dc.numberDisplay("#number-records-nd");
	var timeChart = dc.barChart("#time-chart");



	numberRecordsND
		.formatNumber(d3.format("d"))
		.valueAccessor(function(d){return d; })
		.group(all);


	timeChart
		.width(650)
		.height(140)
		.margins({top: 10, right: 50, bottom: 20, left: 20})
		.dimension(dateDim)
		.group(numRecordsByDate)
		.transitionDuration(500)
		.x(d3.time.scale().domain([minDate, maxDate]))
		.elasticY(true)
		.yAxis().ticks(4);


	dc.renderAll();

};