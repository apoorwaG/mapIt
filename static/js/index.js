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
		markermode: true,
		rows: [],
		email: '',
		post_mode: false,
		add_post_title: '',
		add_post_description: '',
		post_latLng: '',
		title: true,
		description: true,
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

	app.set_post_status = function (new_status) {
		app.vue.post_mode = new_status;
	};

	app.cancel_post = function () {
		app.set_post_status(false);
		initMap();
		app.vue.markermode = true;
		app.vue.reset_form();
	};

	app.reset_form = function () {
		app.vue.add_post_title = '';
		app.vue.add_post_description = '';
	};

	app.add_post = function () {
		if (app.vue.add_post_title == '') {
			app.vue.title = false;
		} else {
			app.vue.title = true;
		}
		if (app.vue.add_post_description == '') {
			app.vue.description = false;
		} else {
			app.vue.description = true;
		}

		if (app.vue.add_post_title && app.vue.add_post_description) {
			axios
				.post(add_location_post_url, {
					post_description: app.vue.add_post_description,
					post_title: app.vue.add_post_title,
					latLng: app.vue.post_latLng,
				})
				.then(function (response) {
					app.vue.rows.push({
						id: response.data.id,
						post_description: app.vue.add_post_description,
						post_title: app.vue.add_post_description,
						latLng: e.latLng.toJSON(),
						name: response.data.name,
						email: response.data.email,
					});
					app.enumerate(app.vue.rows);
				});
			app.vue.post_mode = false;
			app.vue.markermode = true;
			app.vue.reset_form();
		}
	};

	// This contains all the methods.
	app.methods = {
		// Complete as you see fit.
		set_post_status: app.set_post_status,
		add_post: app.add_post,
		cancel_post: app.cancel_post,
		reset_form: app.reset_form,
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

	markers = null;

	axios
		.get(load_location_posts_url)
		.then(function (response) {
			app.vue.rows = response.data.rows;
			app.vue.email = response.data.email;
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

			console.log('the boolean of email: ' + app.vue.email);
			console.log('maerkmode is : ' + app.vue.markermode);
			if (app.vue.email != null) {
				map.addListener('click', (e) => {
					if (app.vue.markermode) {
						console.log(' line 173maerkmode is : ' + app.vue.markermode);
						console.log(e.latLng.toJSON());
						app.set_post_status(true);
						app.vue.post_latLng = JSON.stringify(e.latLng.toJSON());
						placeMarkerAndPanTo(e.latLng, map);
					}
					app.vue.markermode = false;
				});
			}

			var infowindows = [];
			for (let i = 0; i < markers.length; i++) {
				console.log('markers length ' + markers.length);
				const infowindow = new google.maps.InfoWindow({
					content:
						'<h1 class="title is-4 has-text-centered">' +
						app.vue.rows[i].post_title +
						//'\n' +
						'</h1>' +
						'<div class = "block">' +
						'<img width ="300" src="https://storage.googleapis.com/post_image_uploads/cf1c2842-bf43-11eb-a7cd-10ddb1b271fe.JPG" alt="Doenst work">' +
						'</div>' +
						'<div class="box has-background-light" style="width: 300px;">' +
						'<p class="is-size-6">' +
						app.vue.rows[i].post_description +
						'</p>' +
						'<p class="is-size-7 has-text-left has-text-info-dark p-2">' +
						app.vue.rows[i].name +
						'</p>' +
						'</div>' +
						'<div v-if="r.email == email">
						<div class="level-right">
							<a class="level-item">
								<i
									@click="delete_contact(r._idx)"
									class="fa fa-trash"
									aria-hidden="true"
									style="color: red"
								></i>
							</a>
						</div>
					</div>'',
				});
				infowindows.push(infowindow);
				console.log('infowindows: ' + infowindows);
				markers[i].addListener('click', () => {
					infowindows[i].open(map, markers[i]);
					console.log('clicks');
				});
			}

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
