let map;

// This will be the object that will contain the Vue attributes
// and be used to initialize it.
let app = {};

// Given an empty app object, initializes it filling its attributes,
// creates a Vue instance, and then initializes the Vue instance.
let init = (app) => {
	app.map = null;

	// This is the Vue data.
	app.data = {
		locations: [],
		// Complete as you see fit.
	};

	app.enumerate = (a) => {
		// This adds an _idx field to each element of the array.
		let k = 0;
		a.map((e) => {
			e._idx = k++;
		});
		return a;
	};

	// This contains all the methods.
	app.methods = {
		// Complete as you see fit.
	};

	// This creates the Vue instance.
	app.vue = new Vue({
		el: '#vue-target',
		data: app.data,
		methods: app.methods,
	});

	// And this initializes it.
	app.init = () => {
		// Put here any initialization code.
		// Typically this is a server GET call to load the data.
		// app.vue.locations = [
		// 	{ lat: -31.56391, lng: 147.154312 },
		// 	{ lat: -33.718234, lng: 150.363181 },
		// 	{ lat: -33.727111, lng: 150.371124 },
		// 	{ lat: -33.848588, lng: 151.209834 },
		// 	{ lat: -33.851702, lng: 151.216968 },
		// 	{ lat: -34.671264, lng: 150.863657 },
		// 	{ lat: -35.304724, lng: 148.662905 },
		// 	{ lat: -36.817685, lng: 175.699196 },
		// 	{ lat: -36.828611, lng: 175.790222 },
		// 	{ lat: -37.75, lng: 145.116667 },
		// 	{ lat: -37.759859, lng: 145.128708 },
		// 	{ lat: -37.765015, lng: 145.133858 },
		// 	{ lat: -37.770104, lng: 145.143299 },
		// 	{ lat: -37.7737, lng: 145.145187 },
		// 	{ lat: -37.774785, lng: 145.137978 },
		// 	{ lat: -37.819616, lng: 144.968119 },
		// 	{ lat: -38.330766, lng: 144.695692 },
		// 	{ lat: -39.927193, lng: 175.053218 },
		// 	{ lat: -41.330162, lng: 174.865694 },
		// 	{ lat: -42.734358, lng: 147.439506 },
		// 	{ lat: -42.734358, lng: 147.501315 },
		// 	{ lat: -42.735258, lng: 147.438 },
		// 	{ lat: -43.999792, lng: 170.463352 },
		// ];
	};

	app.set_map = function (map) {
		app.map = map;
	};

	// Call to the initializer.
	app.init();
};

// This takes the (empty) app object, and initializes it,
// putting all the code i
init(app);

function initMap() {
	map = new google.maps.Map(document.getElementById('map'), {
		center: { lat: 36.974, lng: -122.030792 },
		zoom: 14,
	});

	axios
		.get(load_location_posts_url)
		.then(function (response) {
			app.vue.rows = response.data.rows;
			app.vue.locations = response.data.rows.map((a) => JSON.parse(a.latLng));
			console.log(app.vue.locations);
		})
		.then(function (response) {
			// Add some markers to the map.
			// Note: The code uses the JavaScript Array.prototype.map() method to
			// create an array of markers based on a given "locations" array.
			// The map() method here has nothing to do with the Google Maps API.
			const markers = app.vue.locations.map((location) => {
				console.log(location);
				return new google.maps.Marker({
					position: location,
					map,
				});
			});

			map.addListener('click', (e) => {
				console.log(e.latLng.toJSON());
				placeMarkerAndPanTo(e.latLng, map);
				axios
					.post(add_location_post_url, {
						post_content: app.vue.add_post_content,
						latLng: JSON.stringify(e.latLng.toJSON()),
					})
					.then(function (response) {
						app.vue.rows.push({
							id: response.data.id,
							post_content: app.vue.add_post_content,
							latLng: e.latLng.toJSON(),
							name: response.data.name,
							email: response.data.email,
						});
					});
			});

			app.set_map(map);
		});
}

function placeMarkerAndPanTo(latLng, map) {
	new google.maps.Marker({
		position: latLng,
		map: map,
	});
	map.panTo(latLng);
}
