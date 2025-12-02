const options = {method: 'GET', headers: {accept: 'application/json'}};
//params in here: (1) key (2) locationID

fetch('https://api.content.tripadvisor.com/api/v1/location/locationId/reviews?language=en&key=2A711706866C4F0992B71088F8F14DE4', options)
    .then(res => res.json())
    .then(res => console.log(res))
    .catch(err => console.error(err));