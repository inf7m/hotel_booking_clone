// src/pages/AdminHotels.jsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api, { resolveAsset } from "../utils/api";

export default function AdminHotels() {
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHotels();
  }, []);

  async function loadHotels() {
    try {
      setLoading(true);
      const res = await api.get("/hotels");
      setHotels(res.data.hotels || res.data.data || []);
    } catch (err) {
      console.error(err);
      alert("Không thể lấy danh sách khách sạn");
    } finally {
      setLoading(false);
    }
  }

  const deleteHotel = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xoá khách sạn này?")) return;
    try {
      await api.delete(`/hotels/${id}`);
      setHotels((prev) => prev.filter((h) => h.id !== id));
      alert("Xoá thành công");
    } catch (err) {
      console.error(err);
      alert("Lỗi xoá khách sạn");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="h-12 w-12 rounded-full border-b-2 border-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <span className="text-2xl">🏨</span>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Quản lý Khách Sạn
            </h1>
            <p className="text-sm text-gray-500">
              Xem, chỉnh sửa và quản lý phòng cho từng khách sạn
            </p>
          </div>
        </div>

        {/* Grid hotels */}
        <div className="bg-white rounded-2xl shadow p-5">
          {hotels.length === 0 ? (
            <div className="py-10 text-center text-sm text-gray-500">
              Chưa có khách sạn nào.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {hotels.map((hotel) => (
                <div
                  key={hotel.id}
                  className="flex flex-col bg-gray-50 rounded-xl overflow-hidden border border-gray-200 hover:shadow-md transition-shadow"
                >
                  {/* Ảnh */}
                  <div className="h-40 w-full overflow-hidden">
                    <img
                      src={resolveAsset(hotel.image_url)}
                      alt={hotel.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src =
                          "https://via.placeholder.com/400x250?text=No+Image";
                      }}
                    />
                  </div>

                  {/* Nội dung */}
                  <div className="flex-1 flex flex-col px-4 py-3">
                    <div className="mb-2">
                      <h2 className="text-sm font-semibold text-gray-900 line-clamp-2">
                        {hotel.name}
                      </h2>
                      <p className="text-xs text-gray-500 mt-1">
                        {hotel.city || "Chưa cập nhật"}
                      </p>
                    </div>

                    <p className="text-xs text-gray-600 line-clamp-2 mb-3">
                      {hotel.description || "Chưa có mô tả."}
                    </p>

                    {/* Nút hành động */}
                    <div className="mt-auto pt-2 border-t border-gray-200 flex items-center justify-between gap-2">
                      <Link
                        to={`/admin/hotel/edit/${hotel.id}`}
                        className="flex-1 text-center px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700"
                      >
                        Sửa
                      </Link>
                      <Link
                        to={`/admin/hotel/${hotel.id}/rooms`}
                        className="flex-1 text-center px-3 py-1.5 rounded-lg bg-green-600 text-white text-xs font-medium hover:bg-green-700"
                      >
                        Phòng
                      </Link>
                      <button
                        onClick={() => deleteHotel(hotel.id)}
                        className="flex-1 text-center px-3 py-1.5 rounded-lg bg-red-500 text-white text-xs font-medium hover:bg-red-600"
                      >
                        Xoá
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
