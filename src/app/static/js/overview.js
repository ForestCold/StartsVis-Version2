/*
	Generate class dependencies graph
	Author : Hanfei Lin
	Date: 10/14/2017
*/

vis.overview = function(){

	var overview = {},
		container = null,
		data = null,
		size = [960, 800],
	 	margin = {left:10, top:10, right:10, bottom:10},
		dispatch = d3.dispatch("select", "mouseover", "mouseout");

	overview.container = function(_) {
		if (!arguments.length) return container;
		container = _;
		return overview;
	};

	overview.data = function(_) {
		if (!arguments.length) return data;
		data = _;
		return overview;
	};

	overview.dispatch = dispatch;

	///////////////////////////////////////////////////
	// Private Parameters
	var group,
			formatPercent,
			x,
			y,
			xAxis,
			yAxis;

	var selected = [];

	///////////////////////////////////////////////////
	// Public Function
	overview.layout = function() {

		size[0] = parseInt(container.style("width")) - margin.left;
		size[1] = parseInt(container.style("height")) - margin.bottom;

    group = groupCaculator();
		for (var i = 0; i < group.length; i++){
			selected[group[i].id] = false;
		}

		formatPercent = d3.format(".0%");

		x = d3.scaleBand().rangeRound([margin.left, size[0] - margin.right]).padding(0.1),
		y = d3.scaleLinear().rangeRound([size[1] - margin.top, 0]);

		x.domain(group.map(function(d) { return d.id;}));
  	y.domain([0, d3.max(group, function(d) { return d.count;})]);

		return overview;
	};

	overview.render = function() {

		var color = d3.scaleOrdinal(d3.schemeCategory20).domain(d3.range(1, 16));

		var svg = container.append("svg")
				.style("width", size[0])
				.style("height", size[1])

		var groupbar = svg.append("g")
		 .attr("transform", "translate(" + 0 + "," + margin.top + ")");

		groupbar.selectAll(".bar")
			.data(group)
			.enter().append("rect")
			.attr("class", "bar")
			.attr("fill", function(d){return color(d.id)})
			.attr("x", function(d) { return x(d.id); })
			.attr("y", function(d) { return y(d.count); })
			.attr("width", x.bandwidth())
			.attr("height", function(d) { return size[1] - y(d.count); })
			.on("mouseover", function(d) {

				var label = d3.select(".tooltip")
					.style("opacity", 0);

				//add tooltip to show the group name
				label.transition()
           .duration(200)
           .style("opacity", .9)

        label.html(d.name)
           .style("left", (d3.event.pageX) + 10 + "px")
           .style("top", (d3.event.pageY) + "px");

				dispatch.call("mouseover", this, d);

			}).on("mouseout", function(d){

				var label = d3.select(".tooltip")
					.style("opacity", 0);

				//remove tooltip
				label.transition()
						.duration(500)
						.style("opacity", 0);

				dispatch.call("mouseout", this, d);

			}).on("click", function(d){

				if (selected[d.id] == true){
					d3.select(this).classed("selected", false);
					selected[d.id] = false;
				} else {
					d3.select(this).classed("selected", true);
					selected[d.id] = true;
				}

				var select = [];
				for (var i = 0; i < selected.length; i++){
					if (selected[i]){
						select.push(i);
					}
				}

				dispatch.call("select", this, select);
			})


		return overview.update();
	};

	overview.update = function() {
		return overview;
	};

	overview.dispatch = dispatch;

	///////////////////////////////////////////////////
	// Private Functions

	function groupCaculator() {

		var group = [];
		var groupResult = [];

		for (var i = 0; i < data.nodes.length; i++){
			var index = data.nodes[i].group.id;
			if (typeof(group[index]) == "undefined"){
				group[index] = {
					id: index,
					name: data.nodes[i].group.name,
					count: 0,
					nodes: []
				}
			} else {
				group[index].count += 1;
				group[index].nodes.push(data.nodes[i]);
			}
		}

		for (var i = 0; i < group.length; i++){
			if (typeof(group[i]) != "undefined"){
				groupResult.push(group[i]);
			}
		}

		return groupResult;
	};

	function private_function2() {

	};

	function private_function3() {

	};

	return overview;
};
