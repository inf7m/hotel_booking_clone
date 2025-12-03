// Check if the browser supports geolocation
if (navigator.geolocation) {
    // Ask for the user’s location
    navigator.geolocation.getCurrentPosition(
        (position) => {
            // This function runs if user allows
            const userLat = position.coords.latitude;
            const userLng = position.coords.longitude;
            console.log("User location:", userLat, userLng);
        },
        (error) => {
            // This function runs if user denies or there is an error
            console.error("Could not get location:", error.message);
        }
    );
} else {
    console.error("Geolocation is not supported by this browser");
}
