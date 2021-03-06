 // Initialize leaflet.js
 // Initialize the map and set view to your current location
 //var markers = L.layerGroup()

 import https from 'https';

 var marker = L.marker()
 var map = L.map('map', {
     doubleClickZoom: false,
     drawControl: true
 }).locate({
     setView: true,
     maxZoom: 18
 });

 // Initialize the base layer
 L.tileLayer(
     'https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
         attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
         maxZoom: 18,
         id: 'mapbox.satellite',
         accessToken: 'pk.eyJ1IjoibGVtb25ncmFmdCIsImEiOiJjazBwZGgyOGcwMDd1M21wZmcwa3V0cnE0In0.AsGe8WOsKpPrQjhHtdf-Rw'
     }).addTo(map);

 //add marker where you click
 map.on('click', function (e) {

     var cords = {
         lat: e.latlng.lat,
         long: e.latlng.lng
     }

     createMarker(cords)

 })

 //add a marker to your approxament location when the page is loaded

 var markers = []

 //create markers
 function createMarker(cords) {
     var id
     if (markers.length < 1) id = 0
     else id = markers[markers.length - 1]._id + 1

     var popupContent =
         '<button onclick="clearMarker(' + id + ')">Clear Marker</button>' +
         '<button onclick="setAsGuildLocation(' + id + ')">Set As Guild Location</button>';

     myMarker = L.marker([cords.lat, cords.long], {
         draggable: false
     });
     myMarker._id = id
     var myPopup = myMarker.bindPopup(popupContent, {
         closeButton: false
     });
     map.addLayer(myMarker)
     markers.push(myMarker)
 }

 //delete markers
 function clearMarker(id) {
     var new_markers = []
     markers.forEach(function (marker) {
         if (marker._id == id) map.removeLayer(marker)
         else new_markers.push(marker)
     })
     markers = new_markers
 }

 function setAsGuildLocation(id) {
     var new_markers = []
     markers.forEach(function (marker) {
         if (marker._id == id) {
             var loc = marker.toGeoJSON()
             console.log("Added " + JSON.stringify(loc.geometry.coordinates[1]) + ", " + JSON.stringify(
                 loc.geometry.coordinates[0]) + " To guilds")
             getNearestAddress(loc)
         } else new_markers.push(marker)
     })
 }

 function getNearestAddress(loc) {
     fetch(
             `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${loc.geometry.coordinates[1]}&lon=${loc.geometry.coordinates[0]}`)
         .then(function (data) {
             return data.json()
         }).then(function (geoloc) {
             console.log(geoloc.address.road)
             console.log(geoloc.address.house_number)
             console.log(geoloc.address.road)
             console.log(geoloc.address.county)
             console.log(geoloc.address.state)
             console.log(geoloc.address.postcode)
             console.log(geoloc.address.country)
             console.log(geoloc.address.country_code)

         }).catch(function (error) {

             if (error) throw error

         })
 }
 //this functions retreves and the displayes the addresses found
 function findAddress() {
     fetch(
             `https://nominatim.openstreetmap.org/search/${document.getElementById("addSearch").value}?format=json&limit=8`
         )
         .then(function (data) {

             return data.json()

         }).then(function (results) {

             //clear the tag so it updates dynamicly
             document.getElementById("searchResults").innerHTML = ""

             results.forEach(element => {

                 console.log(element.lat)
                 console.log(element.lon)
                 console.log(element)

                 document.getElementById("searchResults").innerHTML +=
                     ` <a class="link" id="${element.place_id}" lat="${element.lat}" lon="${element.lon}" href="#" onclick="handleChangeClick(${element.place_id})"; return false;"><li> ${element.display_name} </li></a>`

             });


         }).catch(function (error) {

             if (error) throw error

         })
 }

 //this handles the click events for the anchor tags
 function handleChangeClick(id) {
     var lat = document.getElementById(`${id}`).getAttribute('lat')
     var lon = document.getElementById(`${id}`).getAttribute('lon')

     changMapView(lat, lon)
 }

 //changes the view of the map
 function changMapView(lat, lon) {
     map.panTo([lat, lon], 18)
     var cords = {
         lat: lat,
         long: lon
     }
     //creates marker on spot you searched for
     createMarker(cords)
 }