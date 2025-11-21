import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api, { resolveAsset } from "../utils/api";

export default function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyBookings();
  }, []);

  const fetchMyBookings = async () => {
    try {
      setLoading(true);
      const response = await api.get("/bookings/my-bookings");
      setBookings(response.data.bookings || []);
    } catch (error) {
      console.error("Error fetching bookings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm("Bạn có chắc muốn hủy đặt phòng này?")) return;

    try {
      await api.patch(`/bookings/${bookingId}/cancel`);
      alert("Hủy đặt phòng thành công!");
      fetchMyBookings();
    } catch (error) {
      alert(error.response?.data?.message || "Có lỗi xảy ra khi hủy đặt phòng");
    }
  };

  const getStatusBadge = (status) => {
    const map = {
      pending: {
        label: "Chờ xác nhận",
        color: "bg-yellow-100 text-yellow-800",
      },
      confirmed: { label: "Đã xác nhận", color: "bg-green-100 text-green-800" },
      cancelled: { label: "Đã hủy", color: "bg-red-100 text-red-800" },
      completed: { label: "Hoàn thành", color: "bg-blue-100 text-blue-800" },
    };
    const info = map[status] || {
      label: status,
      color: "bg-gray-100 text-gray-800",
    };
    return (
      <span
        className={`px-3 py-1 rounded-full text-sm font-medium ${info.color}`}
      >
        {info.label}
      </span>
    );
  };

  const formatDate = (date) =>
    new Date(date).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

  const formatPrice = (price) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);

  // Hàm chọn ảnh hiển thị cho từng booking
  const getHotelImage = (b) => {
    // ảnh bìa chính
    if (b.hotel_image_url) return resolveAsset(b.hotel_image_url);

    // ảnh album (JSON)
    if (b.hotel_image_urls) {
      try {
        const arr = JSON.parse(b.hotel_image_urls);
        if (Array.isArray(arr) && arr.length > 0) return resolveAsset(arr[0]);
      } catch (e) {
        console.error("⚠️ Lỗi parse hotel_image_urls:", e);
      }
    }

    // fallback
    return "https://via.placeholder.com/400x250?text=No+Image";
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Đặt phòng của tôi
        </h1>

        {bookings.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <svg
              className="w-16 h-16 mx-auto text-gray-400 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            <p className="text-gray-600 mb-4">Bạn chưa có đặt phòng nào</p>
            <Link
              to="/"
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Tìm kiếm khách sạn ngay
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {bookings.map((b) => (
              <div
                key={b.id}
                className="bg-white rounded-lg shadow overflow-hidden hover:shadow-md transition"
              >
                <div className="md:flex">
                  {/* Hình ảnh khách sạn */}
                  <div className="md:w-1/3">
                    <img
                      src={getHotelImage(b)}
                      alt={b.hotel_name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src =
                          "https://via.placeholder.com/400x250?text=No+Image";
                      }}
                    />
                  </div>

                  {/* Thông tin đặt phòng */}
                  <div className="md:w-2/3 p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">
                          {b.hotel_name}
                        </h3>
                        <p className="text-gray-600 text-sm mt-1">
                          {b.address}, {b.city}
                        </p>
                      </div>
                      {getStatusBadge(b.status)}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-500">Phòng</p>
                        <p className="font-medium">{b.room_type}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Nhận phòng</p>
                        <p className="font-medium">{formatDate(b.check_in)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Trả phòng</p>
                        <p className="font-medium">{formatDate(b.check_out)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Số khách</p>
                        <p className="font-medium">{b.guests} người</p>
                      </div>
                    </div>

                    {b.special_requests && (
                      <div className="mb-4">
                        <p className="text-sm text-gray-500">
                          Yêu cầu đặc biệt:
                        </p>
                        <p className="text-sm text-gray-700 mt-1">
                          {b.special_requests}
                        </p>
                      </div>
                    )}

                    <div className="flex justify-between items-center pt-4 border-t">
                      <div>
                        <p className="text-sm text-gray-500">Tổng tiền</p>
                        <p className="text-2xl font-bold text-blue-600">
                          {formatPrice(b.total_price)}
                        </p>
                      </div>

                      <div className="flex space-x-3">
                        <Link
                          to={`/hotels/${b.hotel_id}`}
                          className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-md text-sm font-medium"
                        >
                          Xem khách sạn
                        </Link>

                        {(b.status === "pending" ||
                          b.status === "confirmed") && (
                          <button
                            onClick={() => handleCancelBooking(b.id)}
                            className="bg-red-100 hover:bg-red-200 text-red-700 px-4 py-2 rounded-md text-sm font-medium"
                          >
                            Hủy đặt phòng
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
