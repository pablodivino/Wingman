var currPosition;
var currFood;

$(document).ready(function(){
	getLocation();
	$("#makeMeHappy").click(function(){
		var money = $("[name='money']").val();	
		var people = $("[name='people']").val();	
		var food = $("[name='food'] option:selected").text().replace("food", "").trim();
		var time = $("[name='time'] option:selected").text();;	
		var uber = $("[name='uber'] option:selected").text();;	
		var lat = currPosition.coords.latitude;
		var lon = currPosition.coords.longitude;
		$.ajax({
		  type: "POST",
		  url: "/v1/find",
		  data: {
		  	food: food.replace("food", ""),
			slat: lat,
			slon: lon		  	
		  },
		  success: function(data){
		  	console.log(data);
		  	data.restaurants.forEach(function(item, idx){
		  			if(idx >= 5) return;
		  			console.log("IN!");
		  			var thisDiv = jQuery('<div class="cardLayout"><div class="top"><div class="bkg"></div><div class="name"></div><div class="location"></div></div><div class="bottom"><div class="stars"></div><div class="price"></div></div></div>', {
					    id: 'cardId' + idx
					});
					console.log("asdasd");
					thisDiv.addClass("cardLayout");
					thisDiv.find(".name").text(item.name);
					thisDiv.find(".location").text(item.address.address_locality + ", " + item.address.address_region);
					for(var j = 0; j < item.ratings.rating_value; j++){
						var starDiv = jQuery('<div/>', {
						});
						starDiv.addClass("glyphicon glyphicon-star");
						starDiv.appendTo(thisDiv.find(".stars"));
					}
					thisDiv.find(".bkg").css("background-image", "url('" + item.logo + "')");
					thisDiv.find(".price").text("$" + ((item.delivery_minimum.price / 100) + 10));
					thisDiv.appendTo($(".foodList"));

					thisDiv.click(function(){
						currFood = item;
						$(".foodList").hide();
						$(".movieList").show();
						data.movies.forEach(function(item, idx2){
							if(idx2 >= 5) return;
							var movieDiv = jQuery('<div class="cardLayout"><div class="top"><div class="bkg"></div><div class="name"></div><div class="location"></div></div><div class="bottom"><div class="stars"></div><div class="price"></div></div></div>', {
					    		id: 'cardId' + idx
							});
							movieDiv.addClass("cardLayout");
							movieDiv.find(".name").text(item.title);
							movieDiv.find(".location").text(item.showtimes[0].theatre.name);
							movieDiv.find(".stars").text(item.ratings[0].code);
							var time = new Date(item.showtimes[0].dateTime);
							movieDiv.find(".price").text((time.getHours() < 10 ? ("0" + time.getHours()) : time.getHours())
							 + ":" + (time.getMinutes() < 10 ? ("0" + time.getMinutes()) : time.getMinutes()));
							movieDiv.appendTo(".movieList");

							movieDiv.click(function(){
								calculateUber(currFood, item);
							})
						});
					});
		  	});
		  }
		});
	});
});

function calculateUber(food, movie){
	var ways = [];
	var currLoc = new google.maps.LatLng(currPosition.coords.latitude,currPosition.coords.longitude);
	 var request = {
	    location: currLoc,
	    radius: '500',
	    query: movie.showtimes[0].theatre.name
	  };

	  var $attrib = $('<div id="attributions"></div>');
	  service = new google.maps.places.PlacesService($attrib[0]);
	  service.textSearch(request, function(results, status){
	  	if (status == google.maps.places.PlacesServiceStatus.OK) {
			var datas = [{
			  	slat: currPosition.coords.latitude,
				slon: currPosition.coords.longitude,
				elat: food.address.latitude,
				elon: food.address.longitude
			  }, {
				slat: food.address.latitude,
				slon: food.address.longitude,
			  	elat: results.geometry.location.lat(),
				elon: results.geometry.location.lng()
			  }, {
			  	slat: results.geometry.location.lat(),
				slon: results.geometry.location.lng(),
				elat: currPosition.coords.latitude,
				elon: currPosition.coords.longitude
			  }]
			for(int i = 0; i < datas.length; i++){
				ways[i] = getUber(datas[i]);
			}
		 	
		}
	  });
}

function getUber(data){
	$.ajax({
		  type: "POST",
		  url: "/v1/uber",
		  data: data,
		  success: function(data){
		  	ways[0] = {
		  		price: data.price.prices[0].estimate,
		  		duration: data.price.prices[0].duration / 60,
		  		distance: data.price.prices[0].distance
		  	}
		  	
		  }
		});
}



function getLocation() {
    navigator.geolocation.getCurrentPosition(locationSuccess, locationError);
}

function locationSuccess(position) {
	currPosition = position;
}

function locationError(error) {
	currPosition = null;
}