"use strict";

window.addEventListener("load", function() {
	var request = function(filename, callback) {
		var xhttp = new XMLHttpRequest();
		xhttp.addEventListener("readystatechange", function() {
			if (xhttp.readyState === XMLHttpRequest.DONE) {
				callback(filename, JSON.parse(xhttp.responseText));
			}
		})
		xhttp.open('GET', "data/" + filename + ".json", true);
		xhttp.send(null);
	}, world, players,
	waitGroup = function(callback) {
		var state = 0;
		this.add = function(amount)  {
			amount = amount || 1;
			state += amount;
		};
		this.remove = function() {
			state--;
			if (state === 0) {
				callback();
			}
		};
	}, wg, players = {}, world = {},
	transparent = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAANEgAADToB6N2Z3gAAAAtJREFUCJljYAACAAAFAAFiVTKIAAAAAElFTkSuQmCC",
	clearBody = function() {
		while (document.body.hasChildNodes()) {
			document.body.removeChild(document.body.lastChild);
		}
	},
	showRegion = function(region) {

	},
	showRealm = function() {
		var width = 0, height = 0,
		    regions = Object.keys(this.Regions),
		    water = document.createElementNS("http://www.w3.org/2000/svg", "svg"),
		    map = document.createElement("map"),
		    overlay = document.createElement("img");
		map.setAttribute("id", "regions");
		for (var i = 0; i < regions.length; i++) {
			var coords = this.Regions[regions[i]].Area,
			    g = water.appendChild(document.createElementNS("http://www.w3.org/2000/svg", "svg")),
			    region = g.appendChild(document.createElementNS("http://www.w3.org/2000/svg", "polygon")),
			    name = g.appendChild(document.createElementNS("http://www.w3.org/2000/svg", "text")),
			    area = map.appendChild(document.createElement("area")),
			    mapCoords = [],
			    polyCoords = [],
			    minX = 1000000, minY = 1000000, rWidth = 0, rHeight = 0;

			for (var j = 0; j < coords.length; j++) {
				var coord = coords[j];
				if (coord[0] < minX) {
					minX = coord[0];
				}
				if (coord[1] < minY) {
					minY = coord[1];
				}
			}
			for (var j = 0; j < coords.length; j++) {
				var coord = coords[j];
				if (coord[0] > width) {
					width = coord[0];
				}
				if (coord[1] > height) {
					height = coord[1];
				}
				mapCoords.push(coords[j].join(","));
				coord[0] -= minX;
				coord[1] -= minY;
				if (coord[0] > rWidth) {
					rWidth = coord[0];
				}
				if (coord[1] > rHeight) {
					rHeight = coord[1];
				}
				polyCoords.push(coords[j].join(","));
			}
			g.setAttribute("x", minX);
			g.setAttribute("y", minY);
			region.setAttribute("style", "fill: "+this.Regions[regions[i]].Colour+";stroke:purple;stroke-width:1");
			region.setAttribute("points", polyCoords.join(" "));
			area.setAttribute("shape", "polygon");
			area.setAttribute("coords", mapCoords.join(","));
			area.addEventListener("click", showRegion.bind(this, regions[i]));
			name.appendChild(document.createTextNode(this.Regions[regions[i]].Name));
			name.setAttribute("style", "font-family: Verdana; font-size: 16; stroke: #000; fill: #000;");
			name.setAttribute("x", rWidth>>1);
			name.setAttribute("y", rHeight>>1);
			name.setAttribute("text-anchor", "middle");
		}
		width += 100;
		height += 100;
		water.setAttribute("style", "position:absolute; top: 0px; left: 0px; height: " + height + "px; width: " + width  + "px; background-color: #00f;");
		//water.setAttribute("height", height);
		//water.setAttribute("width", width);
		overlay.setAttribute("src", transparent);
		overlay.setAttribute("style", "position:absolute; top: 0px; left: 0px; height: " + height + "px; width: " + width  + "px;");
		overlay.setAttribute("usemap", "#regions");
		clearBody();
		document.body.appendChild(map);
		document.body.appendChild(water);
		document.body.appendChild(overlay);
	},
	wg = new waitGroup(function() {
		var ul = document.createElement("ul"),
		    realms = Object.keys(world);
		for (var i = 0; i < realms.length; i++) {
			var li = document.createElement("li");
			li.appendChild(document.createTextNode(world[realms[i]].Name));
			li.addEventListener("click", showRealm.bind(world[realms[i]]));
			ul.appendChild(li);
		}
		clearBody();
		document.body.appendChild(ul);
	});
	wg.add(2)
	request("world", function(filename, data) {
		for (var i = 0; i < data.length; i++) { // each realm
			world[data[i]["Filename"]] = {"Name": data[i]["Name"], "Regions": {}};
			wg.add();
			request(data[i]["Filename"], function(realm, data) { // each region in a realm
				for (var i = 0; i < data.length; i++) {
					world[realm].Regions[data[i]["Filename"]] = {"Name": data[i]["Name"], "Area": data[i]["Area"], "Colour": data[i]["Colour"], "Areas": {}, "Settlements": {}, "Places": {}};
					wg.add();
					request(data[i].Filename, function(region, data) {
						var areas = data["Areas"],
						    settlements = data["Settlements"],
						    places = data["Places"];
						for (var i = 0; i < settlements.length; i++) { // each settlement (village, town, city, etc) in a region) 
							world[realm].Regions[region].Settlements[settlements[i]["Filename"]] = {"Name": settlements[i]["Name"], "Roads": {}, "Buildings": {}, "Other": {}};
							wg.add();
							request(settlements[i]["Filename"], function(settlement, data) {
								world[realm].Regions[region].Settlements[settlement].Roads = data["Roads"];
								world[realm].Regions[region].Settlements[settlement].Buildings = data["Buildings"];
								world[realm].Regions[region].Settlements[settlement].Other = data["Other"];
								wg.remove();
							});
						}
						wg.remove();
					});
				}
				wg.remove();
			});
		}
		wg.remove();
	});
	request("players", function(data) {
		players = data;
		wg.remove();
	});
});
