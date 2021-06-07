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
		add_post_image: '',
		post_latLng: '',
		title: true,
		description: true,

		// GCS
		image: true,
		image_name: '',
		file_path: null, // Path of file in GCS
		uploading: false, // upload in progress
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
		app.vue.add_post_image = '';
		app.vue.title = true;
		app.vue.description = true;
		app.vue.image = true;
		app.vue.file_path = null;
		app.vue.image_name = '';
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
		if (app.vue.add_post_image == '') {
			app.vue.image = false;
		} else {
			app.vue.image = true;
		}

		if (
			app.vue.add_post_title &&
			app.vue.add_post_description &&
			app.vue.add_post_image
		) {
			axios
				.post(add_location_post_url, {
					post_description: app.vue.add_post_description,
					post_title: app.vue.add_post_title,
					image: app.vue.add_post_image,
					file_path: app.file_path,
					latLng: app.vue.post_latLng,
				})
				.then(function (response) {
					app.vue.rows.push({
						id: response.data.id,
						post_description: app.vue.add_post_description,
						post_title: app.vue.add_post_description,
						image: app.vue.add_post_image,
						file_path: app.file_path,
						latLng: app.vue.post_latLng,
						name: response.data.name,
						email: response.data.email,
					});
					app.enumerate(app.vue.rows);
				});
			app.vue.post_mode = false;
			app.vue.markermode = true;
			app.vue.reset_form();
			initMap();
		}
	};

	app.upload_file = function (event) {
		let input = event.target;
		let file = input.files[0];
		let file_type = file.type;
		let file_name = file.name;
		if (file) {
			app.vue.uploading = true;
			// Requests the upload URL.
			axios
				.post(obtain_gcs_url, {
					action: 'PUT',
					mimetype: file_type,
					file_name: file_name,
				})
				.then((r) => {
					let upload_url = r.data.signed_url;
					app.vue.file_path = r.data.file_path;
					app.vue.add_post_image = r.data.add_post_image;
					console.log(app.vue.add_post_image);
					// Uploads the file, using the low-level interface.
					let req = new XMLHttpRequest();
					// We listen to the load event = the file is uploaded, and we call upload_complete.
					// That function will notify the server `of the location of the image.
					req.addEventListener('load', function () {
						app.vue.image = true;
						app.vue.image_name = file_name;
					});
					// TODO: if you like, add a listener for "error" to detect failure.
					req.open('PUT', upload_url, true);
					req.send(file);
				});
		}
	};

	app.delete_post = function (row_idx) {
		let id = app.vue.rows[row_idx].id;
		axios
			.get(delete_post_url, { params: { id: id } })
			.then(function (response) {
				for (let i = 0; i < app.vue.rows.length; i++) {
					if (app.vue.rows[i].id === id) {
						app.vue.rows.splice(i, 1);
						app.enumerate(app.vue.rows);
						break;
					}
				}
			});
	};

	// This contains all the methods.
	app.methods = {
		// Complete as you see fit.
		set_post_status: app.set_post_status,
		add_post: app.add_post,
		cancel_post: app.cancel_post,
		reset_form: app.reset_form,
		delete_post: app.delete_post,

		// GCS
		upload_file: app.upload_file, // Uploads a selected file
		// delete_file: app.delete_file, // Delete the file.
		// download_file: app.download_file, // Downloads it.
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

function myFunction2(i) {
	console.log('enters myfunct2 i:' + i);
	app.vue.rows.splice(i, 1);
	app.enumerate(app.vue.rows);
	initMap();
}

function initMap() {
	map = new google.maps.Map(document.getElementById('map'), {
		center: { lat: 36.974, lng: -122.030792 },
		zoom: 12,
	});

	markers = null;

	axios
		.get(load_location_posts_url)
		.then(function (response) {
			app.vue.rows = response.data.rows;
			app.vue.email = response.data.email;
			app.vue.locations = response.data.rows.map((a) => JSON.parse(a.latLng));
		})
		.then(function (response) {
			// Add some markers to the map.
			// Note: The code uses the JavaScript Array.prototype.map() method to
			// create an array of markers based on a given "locations" array.
			// The map() method here has nothing to do with the Google Maps API.
			const markers = app.vue.locations.map((location) => {
				return new google.maps.Marker({
					position: location,
					map,
					animation: google.maps.Animation.DROP,
				});
			});

			if (app.vue.email != null) {
				map.addListener('click', (e) => {
					if (app.vue.markermode) {
						app.set_post_status(true);
						app.vue.post_latLng = JSON.stringify(e.latLng.toJSON());
						placeMarkerAndPanTo(e.latLng, map);
					}
					app.vue.markermode = false;
				});
			}

			var infowindows = [];
			for (let i = 0; i < markers.length; i++) {
				console.log(app.vue.rows);
				const infowindow = new google.maps.InfoWindow({
					content:
						(app.vue.rows[i].email == app.vue.email
							? '<a class="button is-danger" onclick="myFunction(' +
							  app.vue.rows[i].id +
							  ',' +
							  i +
							  ')"> ' +
							  '<span class="icon"><i class="fa fa-fw fa-trash"></i></span>' +
							  '</a>'
							: '') +
						'<h1 class="title is-4 has-text-centered">' +
						app.vue.rows[i].post_title +
						//'\n' +
						'</h1>' +
						'<div class = "block">' +
						'<img width ="300" src=' +
						app.vue.rows[i].image +
						' alt="Image cannot be found!">' +
						'</div>' +
						'<div class="box has-background-light" style="width: 300px;">' +
						'<p class="is-size-6">' +
						app.vue.rows[i].post_description +
						'</p>' +
						'<p class="is-size-7 has-text-left has-text-info-dark p-2">' +
						app.vue.rows[i].name +
						'</p>' +
						'</div>',
					// 	+
					// 	'<div v-if="r.email == email">
					// 	<div class="level-right">
					// 		<a class="level-item">
					// 			<i
					// 				@click="delete_contact(r._idx)"
					// 				class="fa fa-trash"
					// 				aria-hidden="true"
					// 				style="color: red"
					// 			></i>
					// 		</a>
					// 	</div>
					// </div>',
				});
				infowindows.push(infowindow);
				markers[i].addListener('click', () => {
					infowindows[i].open(map, markers[i]);
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
