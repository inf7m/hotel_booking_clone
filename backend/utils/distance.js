const geolib = require("geolib"); //dependency

function getDistance(firsLatitude, firstLongitude, secondLatitude, secondLongitude) {
    const distance = geolib.getDistance(
        {latitude: firsLatitude, longitude: firstLongitude},
        {latitude: secondLatitude, longitude: secondLongitude}
    );
    return distance/1000; // display in km
}

// Demo-function La Vela Saigon Hotel to Nha Trang / air-line / as the crow-flies
const result = getDistance(10.788694,106.68536,12.2388,109.1967);
console.log(result);


function openRouteMatrix(){
    const body = {
        locations: [
            [109.196749, 12.23879],  // Nha Trang
            [106.6853, 10.788694]    // La Vella Saigon
        ],
        metrics: ["distance"],
        units: "km"
    };
    // Calling the openroute API
    fetch("https://api.openrouteservice.org/v2/matrix/driving-car", {
        method: "POST",
        headers: {
            "Accept": "application/json",
            "Content-Type": "application/json",
            "Authorization": "eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6ImE3M2JlNDVhYzNhMDRhNzU5MGRhNTRkNzFhMGVlODU4IiwiaCI6Im11cm11cjY0In0="
        },
        body: JSON.stringify(body) // convert from json to string // body parsing
    })
        .then(res => res.json())
        .then(data => console.log(data))
        .catch(err => console.error(err));
}
openRouteMatrix() // delete after finish

