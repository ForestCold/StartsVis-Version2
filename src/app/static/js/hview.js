/*
	Generate class dependencies graph
	Author : Hanfei Lin
	Date: 10/14/2017
*/

vis.hview = function() {

  var hview = {},
    container = null,
    data = null,
    selectedNodes = [],
    size = [
      960, 800
    ],
    margin = {
      left: 10,
      top: 40,
      right: 10,
      bottom: 10
    },
    dispatch = d3.dispatch("select", "mouseover", "mouseout");

  hview.container = function(_) {
    if (!arguments.length)
      return container;
    container = _;
    return hview;
  };

  hview.data = function(_) {
    if (!arguments.length)
      return data;
    data = _;
    return hview;
  };

  hview.dispatch = dispatch;

  ///////////////////////////////////////////////////
  // Private Parameters

  ///////////////////////////////////////////////////
  // Public Function
  hview.layout = function() {

    size[0] = parseInt(container.style("width")) - margin.top - margin.bottom;
    size[1] = parseInt(container.style("height")) - margin.top - margin.bottom;

    console.log(data)

    return hview;
  };

  hview.render = function() {

    var cellLabel = d3.select("body").append("div").attr("class", "tooltip").style("opacity", 0);

    var classNumber = 0,
      num = 0;

    for (module in data) {
      if (data[module] == "none")
        continue;
      classNumber += d3.set(data[module]["matrix"].map(function(item) {
        return item["class"];
      })).values().length;
      num += 1;
    }

    var itemSizeX = (size[0] - (num - 1) * 10) / classNumber;
    var count = 1;

    for (module in data) {

      (function() {

        if (data[module] == "none") {
          return;
        }

        var matrix = data[module]["matrix"];
        var valueMap = {}

        for (var row in matrix) {
          if (!valueMap[matrix[row]["class"]]) {
            valueMap[matrix[row]["class"]] = {};
          }
          valueMap[matrix[row]["class"]][matrix[row]["test"]] = matrix[row]["value"];
        }

        //setup scales
        var xElements = d3.set(matrix.map(function(item) {
          return item["class"];
        })).values();
        var yElements = d3.set(matrix.map(function(item) {
          return item["test"];
        })).values();
        var vElements = d3.set(matrix.map(function(item) {
          return item["value"];
        })).values();

        var itemSizeY = (size[1] - 25) / yElements.length;

        var xRange = [],
          yRange = [];

        for (var i = 0; i < xElements.length; i++) {
          xRange.push(i * itemSizeX);
        }
        for (var i = 0; i < yElements.length; i++) {
          yRange.push(i * itemSizeY);
        }

        var xScale = d3.scaleOrdinal().domain(xElements).range(xRange);
        var yScale = d3.scaleOrdinal().domain(yElements).range(yRange);

        for (var i in vElements) {
          vElements[i] = parseInt(vElements[i]);
        }

        //setup color
        var colorScale = d3.scaleLinear().domain([
          parseInt(d3.min(vElements)),
          parseInt(d3.max(vElements))
        ]).range(["#08519c", "#f7fbff"]);

        var modu = container.append("div").style('float', 'left').style('margin-top', 10 + "px").style('margin-left', (margin.left - 1) + "px").style("width", xElements.length * itemSizeX + "px").style("height", yElements.length * itemSizeY + 20 + "px")

        //render title
        var tit = modu.append("div").attr("id", "t-" + module).attr("class", "moduTitle").style("width", xElements.length * itemSizeX + "px").style("height", 20 + "px").on("mouseover", function(d) {
          d3.select(this).node().innerHTML = "Load Graph";
        }).on("mouseout", function(d) {
          var moduleName = d3.select(this).property("id").slice(2, d3.select(this).property("id").length);
          d3.select(this).node().innerHTML = moduleName;
        }).on("click", function(d) {
          var moduleName = d3.select(this).property("id").slice(2, d3.select(this).property("id").length);
          dispatch.call("select", this, moduleName, selectedNodes);
        })

        tit.node().textContent = module;

        //render block
        var can = modu.append("div").attr("id", "s-" + module).attr("class", "module").style("width", xElements.length * itemSizeX + "px").style("height", yElements.length * itemSizeY + "px").on("mousemove", function(d) {

          var pos = d3.mouse(d3.select(this).node());

          var x = (Math.floor(pos[0] / itemSizeX)) * itemSizeX + 1;
          var y = (Math.floor(pos[1] / itemSizeY)) * itemSizeY + 1;
          var moduleName = d3.select(this).property("id").slice(2, d3.select(this).property("id").length);

          var offsetLeft = document.getElementById("s-" + moduleName).offsetLeft;
          var offsetTop = document.getElementById("s-" + moduleName).offsetTop;

          if (x <= 0 || y <= 0 || x >= xElements.length * itemSizeX || y >= yElements.length * itemSizeY) {
            d3.select("#b-" + moduleName).style("visibility", "hidden");
            cellLabel.transition().duration(200).style("opacity", 0)
            return;
          }

          d3.select("#b-" + moduleName).style("visibility", "visible").style("left", (x + offsetLeft) + "px").style("top", (y + offsetTop) + "px");

          var crass = xElements[Math.floor(pos[0] / itemSizeX)],
            tast = yElements[Math.floor(pos[1] / itemSizeY)],
            value = "no dependency";

          if (!!valueMap[crass] && !!valueMap[crass][tast]) {
            value = valueMap[crass][tast];
          }

          var cellLabelText = "<b>class:</b> " + data[moduleName]["graph"]["nodes"][crass].value + "</br>" + "<b>test:</b> " + data[moduleName]["graph"]["nodes"][tast].value + "</br>" + "<b>dependency level:</b> " + value;

          //render tooltip
          cellLabel.transition().duration(200).style("opacity", .9)
          cellLabel.html(cellLabelText).style("left", d3.event.pageX - 150 + "px").style("top", d3.event.pageY + 20 + "px");

        }).on("mouseout", function(d) {
          var pos = d3.mouse(d3.select(this).node());
          var x = (Math.floor(pos[0] / itemSizeX)) * itemSizeX + 1;
          var y = (Math.floor(pos[1] / itemSizeY)) * itemSizeY + 1;

          var moduleName = d3.select(this).property("id").slice(2, d3.select(this).property("id").length);
          if (x <= 0 || y <= 0 || x >= xElements.length * itemSizeX || y >= yElements.length * itemSizeY) {
            d3.select("#b-" + moduleName).style("visibility", "hidden");
            cellLabel.transition().duration(200).style("opacity", 0)
            return;
          }
        })

        var block = can.append("div").attr("id", "b-" + module).attr("class", "block").style("position", "absolute").style('top', 0 + "px").style('left', 0 + "px").style("width", itemSizeX + "px").style("height", itemSizeY + "px").style("z-index", 1).style("visibility", "hidden")

        //render heatmap
        var canvas = d3.select("#s-" + module).append("canvas").attr("id", "canvas").attr("width", xElements.length * itemSizeX).attr("height", yElements.length * itemSizeY).style("position", 'absolute')

        var context = canvas.node().getContext("2d");
        matrix.forEach(function(d) {
          //Draw the rectangle
          context.fillStyle = colorScale(d["value"]);
          context.fillRect(xScale(d["class"]), yScale(d["test"]), itemSizeX, itemSizeY);
        });

        var brush = d3.brush().extent([
          [
            0, 0
          ],
          [
            xElements.length * itemSizeX,
            yElements.length * itemSizeY
          ]
        ]).on("start brush", brushed)
        .on("end", brushend)

        var gBrush = can.append("svg").style("position", "absolute").style("z-index", 2).attr("width", xElements.length * itemSizeX).attr("height", yElements.length * itemSizeY).append("g").attr("class", "brush").call(brush);

        function brushed() {

          if (!d3.event.sourceEvent)
            return; // Only transition after input.
          if (!d3.event.selection)
            return; // Ignore empty selections.
          if (d3.event.sourceEvent.type === "brush") return;

            var d0 = d3.event.selection[0],
            d1 = d3.event.selection[1];

            var newX = [], newY = [];
            var m1 = d0[0] - Math.floor(d0[0] / itemSizeX) * itemSizeX;
            var m2 = d1[0] - Math.floor(d1[0] / itemSizeX) * itemSizeX;
            var n1 = d0[1] - Math.floor(d0[1] / itemSizeY) * itemSizeY;
            var n2 = d1[1] - Math.floor(d1[1] / itemSizeY) * itemSizeY;

            newX[0] = (m1 < itemSizeX / 2 ? Math.floor(d0[0] / itemSizeX) : (Math.floor(d0[0] / itemSizeX) + 1)) * itemSizeX;
            newY[0] = (m2 < itemSizeX / 2 ? Math.floor(d1[0] / itemSizeX) : (Math.floor(d1[0] / itemSizeX) + 1)) * itemSizeX;
            newX[1] = (n1 < itemSizeX / 2 ? Math.floor(d0[1] / itemSizeY) : (Math.floor(d0[1] / itemSizeY) + 1)) * itemSizeY;
            newY[1] = (n2 < itemSizeX / 2 ? Math.floor(d1[1] / itemSizeY) : (Math.floor(d1[1] / itemSizeY) + 1)) * itemSizeY;

            d3.select(this).call(d3.event.target.move, [newX, newY]);
        }

        function brushend() {
          if (!d3.event.sourceEvent)
            return; // Only transition after input.
          if (!d3.event.selection)
            return; // Ignore empty selections.
          if (d3.event.sourceEvent.type === "brush") return;

          var d0 = d3.event.selection[0],
          d1 = d3.event.selection[1];

          var classRange = [d0[0] / itemSizeX, d1[0] / itemSizeX - 1],
          testRange = [d0[1] / itemSizeY, d1[1] / itemSizeY - 1];
          var tNumber = Object.keys(data[module]["tests"]["id_tests_map"]).length;

          selectedNodes = filterNodes(classRange, testRange, tNumber);

        }
        count += 1;
      })();
    }

    //render legend
    var legend = container.append("div").attr("class", "legend").style("position", "absolute").style("left", margin.left + (size[0] / 2 - 150) + "px").style("top", size[1] + margin.top + margin.bottom - 25 + "px")

    //render legend text

    var textSvg = container.append("svg").attr("width", 400).attr("height", 30).attr("transform", "translate(" + (margin.left + (size[0] / 2 - 150) - 55) + ',' + 5 + ")");
    var tLeft = textSvg.append("text").text("strong").attr("transform", "translate(" + 0 + ',' + 25 + ")");
    var tRight = textSvg.append("text").text("weak").attr("transform", "translate(" + 360 + ',' + 25 + ")");

    return hview.update();
  };

  hview.update = function() {
    return hview;
  };

  hview.highlightNode = function(nodeInfo, module){

    var tn = Object.keys(data[module]["tests"]["id_tests_map"]).length,
    cn = Object.keys(data[module]["classes"]["id_classes_map"]).length;

    var width, height, top, left;

    var totalWidth = document.getElementById("s-" + module).style.width,
    totalHeight = document.getElementById("s-" + module).style.height;
    var offsetLeft = document.getElementById("s-" + module).offsetLeft;
    var offsetTop = document.getElementById("s-" + module).offsetTop;

    totalWidth = parseFloat(totalWidth.slice(0, totalWidth.length - 2));
    totalHeight = parseFloat(totalHeight.slice(0, totalHeight.length - 2));

    var itemSizeX = totalWidth / cn,
    itemSizeY = totalHeight / tn;

    if (nodeInfo.type == "test"){
      left = 0;
      width = document.getElementById("s-" + module).style.width;
      width = parseFloat(width.slice(0, width.length - 2));
      top = nodeInfo.id * itemSizeY;
      height = itemSizeY;
    } else {
      height = document.getElementById("s-" + module).style.height;
      height = parseFloat(height.slice(0, height.length - 2));
      left = (nodeInfo.id - tn) * itemSizeX;
      width = itemSizeX;
      top = 0;
    }

    container.select("#b-" + module)
    .style("top", top + offsetTop + "px")
    .style("left", left + offsetLeft + "px")
    .style("width", width + "px")
    .style("height", height + "px")
    .style("visibility", "visible")

  }

  hview.unhighlightNode = function(module){

    var tn = Object.keys(data[module]["tests"]["id_tests_map"]).length,
    cn = Object.keys(data[module]["classes"]["id_classes_map"]).length;

    var totalWidth = document.getElementById("s-" + module).style.width,
    totalHeight = document.getElementById("s-" + module).style.height;

    totalWidth = parseFloat(totalWidth.slice(0, totalWidth.length - 2));
    totalHeight = parseFloat(totalHeight.slice(0, totalHeight.length - 2));

    var itemSizeX = totalWidth / cn,
    itemSizeY = totalHeight / tn;

    container.select("#b-" + module)
    .style("width", itemSizeX + "px")
    .style("height", itemSizeY + "px")
    .style("visibility", "hidden")
  }

  ///////////////////////////////////////////////////
  // Private Functions

  function filterNodes(cr, tr, tNumber){

    newNodes = {};
    var tast = [], crass = [];

    for (var i = Math.round(tr[0]); i <= Math.round(tr[1]); i++){
      tast.push(i);
    }

    for (var i = Math.round(cr[0]); i <= Math.round(cr[1]); i++){
      crass.push(i + tNumber);
    }

    newNodes = {
      "test" : tast,
      "class" : crass
    }

    return newNodes;
  };

  function private_function1() {};

  function private_function2() {};

  function private_function3() {};

  return hview;
};
