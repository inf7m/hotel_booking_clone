// frontend/src/pages/DiscoverPage.jsx

import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api, { resolveAsset } from "../utils/api";

export default function DiscoverPage() {
  const { vibe } = useParams();
  const [groups, setGroups] = useState(null);
  const [loading, setLoading] = useState(true);

  const vibeLabels = {
    beach: "Biển",
    mountains: "Núi",
    culture: "Văn hoá",
    city: "Thành phố",
    island: "Đảo",
  };

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/hotels/discover/${vibe}`);
        setGroups(res.data.data || {});
      } catch (err) {
        console.error("discover error:", err);
        setGroups({});
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [vibe]);

  const getHotelImage = (hotel) => {
    // Ưu tiên image_url, sau đó tới image_urls[0]
    let raw =
      hotel.image_url ||
      (Array.isArray(hotel.image_urls) && hotel.image_urls[0]);

    if (!raw) return null;
    try {
      return resolveAsset ? resolveAsset(raw) : raw;
    } catch {
      return raw;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!groups || Object.keys(groups).length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-gray-600">
        <p className="mb-4">Chưa tìm thấy khách sạn phù hợp cho chủ đề này.</p>
        <Link
          to="/"
          className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
        >
          ← Quay lại trang chủ
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 capitalize">
            Gợi Ý Khách Sạn Theo Chủ Đề "{vibeLabels[vibe] || vibe}"
          </h1>
          <p className="text-gray-600 mt-2">
            Các khách sạn được nhóm theo thành phố để bạn dễ lựa chọn.
          </p>
        </div>

        {/* Groups by city */}
        {Object.keys(groups).map((city) => (
          <div key={city} className="mb-10">
            <h2 className="text-2xl font-semibold text-blue-700 mb-4">
              {city}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {groups[city].map((hotel) => {
                const imgUrl = getHotelImage(hotel);
                return (
                  <Link
                    key={hotel.id}
                    to={`/hotels/${hotel.id}`}
                    className="bg-white rounded-xl shadow hover:shadow-lg transition overflow-hidden flex flex-col"
                  >
                    {imgUrl ? (
                      <img
                        src={imgUrl}
                        alt={hotel.name}
                        className="h-40 w-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src =
                            "https://via.placeholder.com/400x300?text=Hotel";
                        }}
                      />
                    ) : (
                      <div className="h-40 w-full bg-gray-100 flex items-center justify-center text-gray-400 text-sm">
                        Không có ảnh
                      </div>
                    )}

                    <div className="p-4 flex-1 flex flex-col">
                      <h3 className="font-semibold text-lg mb-1">
                        {hotel.name}
                      </h3>
                      <p className="text-sm text-gray-500 mb-2">
                        {hotel.address}
                      </p>
                      <div className="mt-auto flex items-center justify-between">
                        <span className="text-blue-600 font-semibold">
                          {hotel.min_price
                            ? `${hotel.min_price.toLocaleString(
                                "vi-VN"
                              )} ₫ / đêm`
                            : "Xem giá"}
                        </span>
                        {hotel.rating > 0 && (
                          <span className="px-2 py-1 text-xs rounded bg-yellow-100 text-yellow-800 flex items-center gap-1">
                            <span>⭐</span>
                            {Number(hotel.rating).toFixed(1)}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
