const options = {method: 'GET', headers: {accept: 'application/json'}};
//latLong is the latitude and the longitude, sample some latLong
const D3 = `10.731839%2C106.702827`
const D1 = `10.7760%2C106.7009`
const D10 = `10.7727%2C106.6684`
const haiPhong = `20.8449%2C106.6881`
const daNang = `16.0544%2C108.2022`
const latLongList = [D1,D3,D10,haiPhong,daNang]
console.log(process.env.tripadvisorAPIKey)
// should finish the checking phase later
const { checkApiConnection } = require('./checkingAPIService.js');  // Import the checkApiConnection function
const {settingUpTheConnection} = require('./ingestToMongoDB/mongodbUtils.js');
console.log(checkApiConnection)
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
fetchData()
// Finish most of the steps, using as backbone