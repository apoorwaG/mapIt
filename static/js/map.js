let map;

function initMap() {
  map = new google.maps.Map(document.getElementById("map"), {
    center: { lat: 36.974, lng: -122.030792 },
    zoom: 14,
  });
}