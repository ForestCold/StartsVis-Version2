/*
	System Driver
	Author : Hanfei Lin
	Date: 10/14/2017
*/

var mainview = vis.mainview();
var overview = vis.overview();
var lview = vis.lview();
var vview = vis.vview();
var hview = vis.hview();

// layout UI and setup events
$(document).ready(function() {
	// init data list
	$.get("/list", function(d) {
		$("#dataset").empty();
		d = $.parseJSON(d);
		d.forEach(function(name) {
			$("#dataset").append(
				"<option>" + name + "</option>"
			);
		});

		display();
	});

	$("#tabs").tabs();
	$("#tablists").tabs();

	wire_views();
});

//////////////////////////////////////////////////////////////////////
// local functions

function search() {
	var className = $("#cn").val();
	mainview.select(className);
}

function display() {

	// clean contents
	d3.select("#mainview").selectAll("*").remove();
	d3.select("#hview").selectAll("*").remove();
	d3.select("#lview").selectAll("*").remove();
	d3.select("#vview").selectAll("*").remove();

	// load datasets
	var data = $('#dataset').val();
	if(!data || data == '') {
		return;
	}

	var url = "data/" + $('#dataset').val();

	d3.json(url, function(error, json) {
		if (error) {
			console.log(error)
			return;
		}

		hview.container(d3.select("#hview")).data(json).layout().render();
		// mainview.container(d3.select("#mainview")).data(json);
		// overview.container(d3.select("#overview")).data(json.graph).layout().render();
		// lview.container(d3.select("#lview")).data(json.graph).layout().render();
    lview.container(d3.select("#lview")).data(json).layout().render();
		vview.data(json);

	});
};

function wire_views(){

	//hview
	hview.dispatch.on('select', function(module, selectedNode) {
		d3.select("#mainview").selectAll("*").remove();

		$.ajax({
      url: "/node_filter",
      method: 'GET',
      data: {
				node: JSON.stringify(selectedNode),
				module: JSON.stringify(module)
			},
      success: function(resp) {
        mainview.container(d3.select("#mainview")).module(module).data(JSON.parse(resp)).layout().render();
      }
		});
	});

	//mainview
	mainview.dispatch.on('select', function(nodeInfo, module, selected) {
		d3.select("#vview").selectAll("*").remove();
		if (selected){
			vview.container(d3.select("#vview")).module(module).nodeInfo(nodeInfo).layout().render();
		}
	});

	mainview.dispatch.on('mouseover', function(nodeInfo, module) {
		hview.highlightNode(nodeInfo, module);
	});

	mainview.dispatch.on('mouseout', function(module) {
		hview.unhighlightNode(module);
	});


}
