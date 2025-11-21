import React from "react";
import { GoogleMap, LoadScript, Marker } from "@react-google-maps/api";

const HotelMap = ({ latitude, longitude, hotelName, address }) => {
  const mapContainerStyle = {
    width: "100%",
    height: "300px",
    borderRadius: "8px",
  };

  // Parse tọa độ, nếu không có thì dùng tọa độ mặc định (TP.HCM)
  const center = {
    lat: parseFloat(latitude) || 10.762622,
    lng: parseFloat(longitude) || 106.660172,
  };

  const mapOptions = {
    zoomControl: true,
    streetViewControl: false,
    mapTypeControl: false,
    fullscreenControl: true,
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-2">Vị trí</h2>
      {address && (
        <p className="text-gray-600 mb-4 flex items-center">
          <svg
            className="w-5 h-5 mr-2 text-blue-600"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
              clipRule="evenodd"
            />
          </svg>
          {address}
        </p>
      )}

      <div className="relative">
        <LoadScript googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}>
          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            center={center}
            zoom={15}
            options={mapOptions}
          >
            <Marker position={center} title={hotelName} />
          </GoogleMap>
        </LoadScript>
      </div>

      <button
        onClick={() =>
          window.open(
            `https://www.google.com/maps?q=${center.lat},${center.lng}`,
            "_blank"
          )
        }
        className="mt-4 w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
            clipRule="evenodd"
          />
        </svg>
        Xem trên Google Maps
      </button>
    </div>
  );
};

export default HotelMap;
