// Declare a map for predefine-status, scalable if neeeded
const statuses = {
    success: { code: 200, message: 'Request to Tripadvisor-API was successful' },
    error: { code: 500, message: 'There was an error with Tripavisor-API' },
    pending: { code: 102, message: 'Request to Tripavisor-API is pending' },
    processing: { code: 102, message: 'Request to Tripavisor-API is being processed' }
};


// function: Checking API connection
// Axios package dependency
const axios = require('axios'); // Make sure to import Axios

// Function to check API connection
async function checkApiConnection(apiUrl) {
    try {
        const response = await axios.get(apiUrl); // Send a GET request
        if (response.status === 200) {
            console.log("Tripadvisor-API Connection Successfull . Status:", response.status);
            return true;
        } else {
            console.log("Tripadvisor-API return with status:", response.status);
            return false;
        }
    } catch (error) {
        console.error("Error connecting to Tripadvisor-API:", error.message);
        return false;  // Catch all the err // Scalable by more-define with error-scope
    }
}

const key = "2A711706866C4F0992B71088F8F14DE4"
const latitude = "10.8231"
const longitude = "106.6297"

const apiURL = `https://api.content.tripadvisor.com/api/v1/location/search?key=${key}&searchQuery=${latitude}%2C${longitude}&language=en`;
console.log(apiURL);
// checkingPoint
checkApiConnection(apiURL)
    .then((isConnected) => {
        if (isConnected) {
            console.log('API is up and ready to go!');
        } else {
            console.log('API is not reachable.');
        }
    });
