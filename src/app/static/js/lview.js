/*
	A code template for a visualization lview
	Author : Hanfei Lin
	Date: 10/14/2017
*/

vis.lview = function() {

  var lview = {},
    container = null,
    data = null,
    size = [
      960, 800
    ],
    margin = {
      left: 10,
      top: 10,
      right: 10,
      bottom: 10,
      middle: 10
    },
    dispatch = d3.dispatch("select", "mouseover", "mouseout");

  lview.container = function(_) {
    if (!arguments.length)
      return container;
    container = _;
    return lview;
  };

  lview.data = function(_) {
    if (!arguments.length)
      return data;
    data = _;
    return lview;
  };

  lview.size = function(_) {
    if (!arguments.length)
      return size;
    size = _;
    return lview;
  };

  lview.margin = function(_) {
    if (!arguments.length)
      return margin;
    margin = _;
    return lview;
  };

  lview.dispatch = dispatch;

  ///////////////////////////////////////////////////
  // Private Parameters
  var modules = [];

  ///////////////////////////////////////////////////
  // Public Function
  lview.layout = function() {

    modules = [];

    size[0] = parseInt(container.style("width"));
    size[1] = parseInt(container.style("height"));

    for (var module in data) {
      if (data[module] == "none") {
        var item = {
          "module": module,
          "classes": 0,
          "tests": 0,
          "libraries": 0,
          "total": 0
        }
        modules.push(item);
        continue;
      }
      var item = {
        "classes": Object.keys(data[module]["classes"]["id_classes_map"]).length,
        "tests": Object.keys(data[module]["tests"]["id_tests_map"]).length,
        "libraries": Object.keys(data[module]["libraries"]["id_libraries_map"]).length,
        "module": module
      }
      item["total"] = item["class"] + item["tests"] + item["libraries"];
      modules.push(item);
    }

    return lview;
  };

  lview.render = function() {

    var chartData = [
      {"name" : "classes", "data": [], "color": "#54b992"},
      {"name" : "tests", "data": [], "color" : "#fb9873"},
      {"name" : "libraries", "data": [], "color" : "#ffe987"}
    ];

    var categories = [];
    for (var m in modules){
      categories.push(modules[m]["module"]);
      for (var i = 0; i < 3; i++){
        var number = i == 0 ? modules[m]["classes"] :(i == 1 ? modules[m]["tests"] : modules[m]["libraries"]);
        chartData[i]["data"].push(number)
      }
    }

    Highcharts.chart('lview', {
        chart: {
            type: 'column'
        },
        title: {
            text: 'modules'
        },
        xAxis: {
            categories: categories
        },
        yAxis: {
            min: 0,
            title: {
                text: 'type percentage'
            }
        },
        tooltip: {
            pointFormat: '<span style="color:{series.color}">{series.name}</span>: <b>{point.y}</b> ({point.percentage:.0f}%)<br/>',
            shared: true
        },
        plotOptions: {
            column: {
                stacking: 'percent'
            }
        },
        series: chartData
    });

    container.select(".highcharts-credits").remove();
    container.select(".highcharts-button").remove();

  };

  lview.update = function() {
    return lview;
  };

  ///////////////////////////////////////////////////
  // Private Functions

  function private_function2() {};

  function private_function3() {};

  return lview;
};
