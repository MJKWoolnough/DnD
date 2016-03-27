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
	}, wg, players = {}, world = {};
	wg = new waitGroup(function() {
		console.log(world);
	});
	wg.add(2)
	request("world", function(filename, data) {
		for (var i = 0; i < data.length; i++) { // each realm
			world[data[i]["Filename"]] = {"Name": data[i]["Name"], "Regions": {}};
			wg.add();
			request(data[i]["Filename"], function(realm, data) { // each region in a realm
				for (var i = 0; i < data.length; i++) {
					world[realm].Regions[data[i]["Filename"]] = {"Name": data[i]["Name"], "Areas": {}, "Settlements": {}, "Places": {}};
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
