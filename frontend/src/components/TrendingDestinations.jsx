import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const destinations = [
  {
    id: 1,
    name: "Ho Chi Minh City",
    city: "TP.HCM",
    image: "https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=800",
    description: "The vibrant economic heart of Vietnam",
  },
  {
    id: 2,
    name: "Da Nang",
    city: "Đà Nẵng",
    image: "https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=800",
    description: "Beautiful beaches and modern city",
  },
  {
    id: 3,
    name: "Hanoi",
    city: "Hà Nội",
    image: "https://www.aseantraveller.net/source/img_news/4555.jpg",
    description: "Historic capital with rich culture",
  },
  {
    id: 4,
    name: "Vung Tau",
    city: "Vũng Tàu",
    image:
      "https://th.bing.com/th/id/R.ab25b5c018755bc3e6b77b6c8688cddd?rik=P821lxW60qJGdg&pid=ImgRaw&r=0",
    description: "Coastal city with stunning beaches",
  },
  {
    id: 5,
    name: "Da Lat",
    city: "Đà Lạt",
    image:
      "https://static.vinwonders.com/production/thanh-pho-da-lat-topbanner.jpg",
    description: "City of eternal spring",
  },
  {
    id: 6,
    name: "Nha Trang",
    city: "Nha Trang",
    image:
      "https://th.bing.com/th/id/R.93a935d0ab36ab6228c702d5e5026a9d?rik=VmHMdliVmmNCpw&riu=http%3a%2f%2foch.vn%2fcms%2fwp-content%2fuploads%2f2021%2f03%2f4.jpg&ehk=g0Aw5rjp0KOqCH%2bVDyal3djg%2bQeJD28mIiquRA8P58Q%3d&risl=&pid=ImgRaw&r=0",
    description: "Paradise for beach lovers",
  },
];

const vibes = [
  { key: "beach", label: "Beach", icon: "🏖️" },
  { key: "mountains", label: "Mountains", icon: "⛰️" },
  { key: "culture", label: "Culture", icon: "🏛️" },
  { key: "city", label: "City", icon: "🏙️" },
  { key: "island", label: "Island", icon: "🌴" },
];

export default function TrendingDestinations() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleVibeClick = (vibe) => {
    if (loading) return;
    setLoading(true);
    // để trang DiscoverPage gọi API /hotels/discover/:vibe
    navigate(`/discover/${vibe}`);
    setLoading(false);
  };

  return (
    <div className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Trending destinations */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">
            Trending destinations
          </h2>
          <p className="text-lg text-gray-600">
            Most popular choices for travellers from Vietnam
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Featured - First 2 large cards */}
          {destinations.slice(0, 2).map((dest) => (
            <Link
              key={dest.id}
              to={`/?city=${encodeURIComponent(dest.city)}`}
              className="group relative h-80 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300"
            >
              <img
                src={dest.image}
                alt={dest.name}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                onError={(e) => {
                  e.currentTarget.src =
                    "https://via.placeholder.com/800x600?text=" + dest.name;
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              <div className="absolute bottom-0 left-0 p-6 text-white">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-3xl font-bold">{dest.name}</h3>
                  <span className="bg-red-600 text-white text-xs px-2 py-1 rounded">
                    🇻🇳
                  </span>
                </div>
                <p className="text-sm text-gray-200">{dest.description}</p>
              </div>
            </Link>
          ))}

          {/* Regular - 4 medium cards */}
          {destinations.slice(2).map((dest) => (
            <Link
              key={dest.id}
              to={`/?city=${encodeURIComponent(dest.city)}`}
              className="group relative h-64 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300"
            >
              <img
                src={dest.image}
                alt={dest.name}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                onError={(e) => {
                  e.currentTarget.src =
                    "https://via.placeholder.com/600x400?text=" + dest.name;
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              <div className="absolute bottom-0 left-0 p-6 text-white">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-2xl font-bold">{dest.name}</h3>
                  <span className="bg-red-600 text-white text-xs px-2 py-1 rounded">
                    🇻🇳
                  </span>
                </div>
                <p className="text-xs text-gray-200">{dest.description}</p>
              </div>
            </Link>
          ))}
        </div>

        {/* Quick trip planner section */}
        <div className="mt-16 text-center">
          <h3 className="text-2xl font-bold text-gray-900 mb-3">
            Quick and easy trip planner
          </h3>
          <p className="text-gray-600 mb-8">
            Pick a vibe and explore the top destinations in Vietnam
          </p>

          <div className="flex flex-wrap justify-center gap-3">
            {vibes.map((v) => (
              <button
                key={v.key}
                onClick={() => handleVibeClick(v.key)}
                className="px-6 py-3 bg-white border-2 border-gray-300 rounded-full hover:border-blue-600 hover:bg-blue-50 transition-all flex items-center gap-2"
              >
                <span>{v.icon}</span>
                <span>{v.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
