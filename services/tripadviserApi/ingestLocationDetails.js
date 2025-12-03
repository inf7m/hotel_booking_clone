const options = {method: 'GET', headers: {accept: 'application/json'}};
const locationID = ""

const { checkApiConnection } = require('./checkingAPIService.js');
const {settingUpTheConnection} = require("./ingestToMongoDB/mongodbUtils");  // Import the checkApiConnection function
console.log(checkApiConnection)

function flattenJSON(json, parentKey = '', result = {}) {// not using yet
    for (let key in json) {
        if (!json.hasOwnProperty(key)) continue;

        const value = json[key];
        const newKey = parentKey ? `${parentKey}.${key}` : key;

        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
            // Recursively flatten nested objects
            flattenJSON(value, newKey, result);
        } else {
            // If it's a primitive value or array, just assign it
            result[newKey] = value;
        }
    }
    return result;
}
//const locationId = "20411635" // It should using the locationID then Scan and Fetch each
// Finish at the end/ bc it depends on the locationID
fetch(`https://api.content.tripadvisor.com/api/v1/location/${locationId}/details?language=vi&currency=USD&key=2A711706866C4F0992B71088F8F14DE4`, options)
    .then(res => res.json())
    .then(res => console.log(res))
    .catch(err => console.error(err));

// MongoDB ingestToMongoDB dependencies

async function fetchData() { // Appending
    const connect = await settingUpTheConnection()
    console.log("thisis"+connect)
    const hotel_info_db = connect.db("hotel_info");
    const promises = latLongList.map(latLong => {
        const url = `https://api.content.tripadvisor.com/api/v1/location/nearby_search?latLong=${latLong}&key=${process.env.tripadvisorAPIKey}&category=hotels&language=en`
        return fetch(url, options)
            .then(async res => {
                const data = await res.json();
                console.log("data", data);
                await hotel_info_db.collection("nearbySearch").insertMany(data.data);
            });
    });
    // Wait until ALL fetches finish
    await Promise.all(promises);
    await connect.close();
}