const options = {method: 'GET', headers: {accept: 'application/json'}};
//latLong is the latitude and the longitude, sample some latLong

const HCMD1   = `10.7760%2C106.7009`;
const daNang  = `16.0544%2C108.2022`;
const daLat   = `11.9404%2C108.4583`;
const nhaTrang= `12.2388%2C109.1967`;
const vungTau = `10.4114%2C107.1362`;
const haNoi   = `21.0278%2C105.8342`;

const latLongList = [HCMD1,daNang,daLat,nhaTrang,vungTau,haNoi];

// should finish the checking phase later
const { checkApiConnection } = require('./checkingAPIService.js');  // Import the checkApiConnection function
const {settingUpTheConnection} = require('./ingestToMongoDB/mongodbUtils.js');
async function fetchData() { // Appending
    const connect = await settingUpTheConnection() // set up a connection to MongoDB
    console.log("thisis"+connect) // Dont Delete it
    const hotel_info_db = connect.db("hotel_info"); // connect to a specific database
    const promises = latLongList.map(latLong => {
        const url = `https://api.content.tripadvisor.com/api/v1/location/nearby_search?latLong=${latLong}&key=${process.env.tripadvisorAPIKey}&category=hotels&language=en`
        return fetch(url, options)
            .then(async res => {
                const data = await res.json(); // format into json
                console.log("data", data); // Dont Delete it
                await hotel_info_db.collection("nearbySearch").insertMany(data.data); // Write down ops to the collection
            });
    });
    // Wait until ALL fetches finish
    await Promise.all(promises); // Promise to make sure all the things get done
    await connect.close(); // Close mongoDB connection, prevent the leak
}
fetchData() // after finish all the scripts, please delete this line