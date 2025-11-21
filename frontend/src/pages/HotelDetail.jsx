import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api, { resolveAsset } from "../utils/api";
import AmenitiesList from "../components/AmenitiesList";
import HotelMap from "../components/HotelMap";

export default function HotelDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [hotel, setHotel] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingData, setBookingData] = useState({
    check_in: "",
    check_out: "",
    guests: 1,
    special_requests: "",
  });

  // gallery khách sạn
  const [heroIdx, setHeroIdx] = useState(0);

  // Gallery phòng
  const [showRoomGallery, setShowRoomGallery] = useState(false);
  const [roomGalleryIdx, setRoomGalleryIdx] = useState(0);
  const [currentRoomGallery, setCurrentRoomGallery] = useState([]);

  useEffect(() => {
    fetchHotelDetail();
  }, [id]);

  const fetchHotelDetail = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/hotels/${id}`);
      const h = res.data.hotel || null;
      setHotel(h);
      setRooms(res.data.rooms || []);
      setReviews(res.data.reviews || []);
      setHeroIdx(0);
    } catch (err) {
      alert(err?.response?.data?.message || "Lỗi tải chi tiết khách sạn");
    } finally {
      setLoading(false);
    }
  };

  const handleBookRoom = (room) => {
    if (!user) {
      alert("Vui lòng đăng nhập để đặt phòng");
      navigate("/login");
      return;
    }
    setSelectedRoom(room);
    setShowBookingModal(true);
  };

  const calculateNights = () => {
    if (!bookingData.check_in || !bookingData.check_out) return 0;
    const checkIn = new Date(bookingData.check_in);
    const checkOut = new Date(bookingData.check_out);
    return Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
  };

  const calculateTotalPrice = () => {
    if (!selectedRoom) return 0;
    return selectedRoom.price * calculateNights();
  };

  const handleSubmitBooking = async (e) => {
    e.preventDefault();
    if (!bookingData.check_in || !bookingData.check_out) {
      alert("Vui lòng chọn ngày nhận và trả phòng");
      return;
    }
    if (new Date(bookingData.check_in) >= new Date(bookingData.check_out)) {
      alert("Ngày trả phòng phải sau ngày nhận phòng");
      return;
    }
    try {
      await api.post("/bookings", {
        room_id: selectedRoom.id,
        hotel_id: hotel.id,
        ...bookingData,
      });
      alert("Đặt phòng thành công! Vui lòng chờ xác nhận từ khách sạn.");
      setShowBookingModal(false);
      navigate("/my-bookings");
    } catch (err) {
      alert(err?.response?.data?.message || "Lỗi khi đặt phòng");
    }
  };

  const formatPrice = (price) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);

  // parse image_urls an toàn
  const parseImageUrls = (imageUrls) => {
    if (!imageUrls) return [];
    if (Array.isArray(imageUrls)) return imageUrls;
    try {
      if (typeof imageUrls === "string") {
        const parsed = JSON.parse(imageUrls);
        return Array.isArray(parsed) ? parsed : [];
      }
    } catch (e) {
      console.error("Error parsing image_urls:", e);
    }
    return [];
  };

  // Gallery phòng
  const openRoomGallery = (roomGallery, startIdx = 0) => {
    setCurrentRoomGallery(roomGallery);
    setRoomGalleryIdx(startIdx);
    setShowRoomGallery(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!hotel) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Không tìm thấy khách sạn</p>
      </div>
    );
  }

  // Parse gallery khách sạn
  const parsedImageUrls = parseImageUrls(hotel.image_urls);
  const gallery = [
    ...(hotel.image_url ? [hotel.image_url] : []),
    ...parsedImageUrls,
  ].filter(Boolean);

  const hero =
    gallery.length > 0
      ? resolveAsset(gallery[heroIdx])
      : "https://via.placeholder.com/800x400";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{hotel.name}</h1>
              <p className="text-gray-600 mt-2">
                📍 {hotel.address}, {hotel.city}
              </p>
            </div>
            {hotel.rating > 0 && (
              <div className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg">
                <span className="text-2xl font-bold">★ {hotel.rating}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* LEFT: thông tin + phòng */}
          <div className="lg:col-span-2">
            {/* Gallery khách sạn */}
            <div className="rounded-lg overflow-hidden shadow-lg mb-3 bg-gray-100">
              <img
                src={hero}
                alt={hotel.name}
                className="w-full h-96 object-cover"
                onError={(e) => {
                  e.currentTarget.src = "https://via.placeholder.com/800x400";
                }}
              />
            </div>

            {gallery.length > 1 && (
              <div className="mb-6">
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {gallery.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setHeroIdx(i)}
                      className={`border rounded-md overflow-hidden h-20 w-28 flex-shrink-0 transition-all ${
                        i === heroIdx
                          ? "ring-2 ring-blue-500 border-blue-500"
                          : "border-gray-300 hover:border-blue-300"
                      }`}
                    >
                      <img
                        src={resolveAsset(img)}
                        alt={`Gallery ${i + 1}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src =
                            "https://via.placeholder.com/300x200";
                        }}
                      />
                    </button>
                  ))}
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  📷 {gallery.length} ảnh • Đang xem ảnh {heroIdx + 1}/
                  {gallery.length}
                </p>
              </div>
            )}

            {/* Giới thiệu */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h2 className="text-2xl font-bold mb-4">Giới thiệu</h2>
              <p className="text-gray-700">
                {hotel.description ||
                  "Khách sạn cung cấp chỗ nghỉ tiện nghi và dịch vụ chất lượng."}
              </p>
            </div>

            {/* Tiện nghi - Component đã fix */}
            <AmenitiesList amenities={hotel.amenities} />

            {/* Google Maps - VỊ TRÍ */}
            <div className="mb-6">
              <HotelMap
                latitude={hotel.latitude}
                longitude={hotel.longitude}
                hotelName={hotel.name}
                address={`${hotel.address}, ${hotel.city}`}
              />
            </div>

            {/* Phòng trống */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-2xl font-bold mb-4">Phòng trống</h2>
              <div className="space-y-4">
                {rooms.map((room) => {
                  const roomParsedUrls = parseImageUrls(room.image_urls);
                  const rGallery = [
                    ...(room.image_url ? [room.image_url] : []),
                    ...roomParsedUrls,
                  ].filter(Boolean);

                  const first =
                    rGallery.length > 0
                      ? resolveAsset(rGallery[0])
                      : "https://via.placeholder.com/300x200?text=Room";

                  return (
                    <div
                      key={room.id}
                      className="border rounded-lg p-4 hover:shadow-md transition"
                    >
                      <div className="flex gap-4">
                        {/* Ảnh chính phòng */}
                        <div
                          className="relative w-40 h-28 flex-shrink-0 rounded-md overflow-hidden bg-gray-100 cursor-pointer hover:opacity-90 transition"
                          onClick={() => openRoomGallery(rGallery, 0)}
                        >
                          <img
                            src={first}
                            alt={room.room_type}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.src =
                                "https://via.placeholder.com/300x200?text=Room";
                            }}
                          />
                          {rGallery.length > 1 && (
                            <div className="absolute bottom-1 right-1 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded">
                              📷 {rGallery.length}
                            </div>
                          )}
                        </div>

                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <div className="flex-1 pr-3">
                              <h3 className="text-lg font-semibold text-gray-900">
                                {room.room_type}
                              </h3>
                              <p className="text-sm text-gray-600 mt-1">
                                {room.description}
                              </p>
                              <div className="text-sm text-gray-500 mt-1">
                                👥 {room.capacity} khách
                              </div>
                            </div>
                            <div className="text-right ml-4">
                              <p className="text-2xl font-bold text-blue-600">
                                {formatPrice(room.price)}
                              </p>
                              <p className="text-sm text-gray-500">/ đêm</p>
                              <button
                                onClick={() => handleBookRoom(room)}
                                className="mt-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-md"
                              >
                                Đặt phòng
                              </button>
                            </div>
                          </div>

                          {/* Thumbnails phòng */}
                          {rGallery.length > 1 && (
                            <div className="flex gap-2 mt-3 overflow-x-auto">
                              {rGallery.slice(0, 8).map((g, i) => (
                                <button
                                  key={i}
                                  onClick={() => openRoomGallery(rGallery, i)}
                                  className="w-16 h-12 rounded border hover:border-blue-500 cursor-pointer transition overflow-hidden flex-shrink-0"
                                >
                                  <img
                                    src={resolveAsset(g)}
                                    alt={`Room ${i + 1}`}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      e.currentTarget.src =
                                        "https://via.placeholder.com/150x100";
                                    }}
                                  />
                                </button>
                              ))}
                              {rGallery.length > 8 && (
                                <div className="w-16 h-12 bg-gray-100 rounded border flex items-center justify-center text-xs text-gray-500 flex-shrink-0">
                                  +{rGallery.length - 8}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                {rooms.length === 0 && (
                  <div className="text-gray-500">
                    Chưa có phòng nào cho khách sạn này.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT: reviews */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6 sticky top-20">
              <h2 className="text-xl font-bold mb-4">Đánh giá từ khách hàng</h2>
              {reviews.length > 0 ? (
                <div className="space-y-4">
                  {reviews.slice(0, 5).map((review) => (
                    <div key={review.id} className="border-b pb-4">
                      <div className="flex items-center mb-2 text-yellow-400">
                        {"★".repeat(review.rating)}
                      </div>
                      <p className="text-sm text-gray-700">{review.comment}</p>
                      <p className="text-xs text-gray-500 mt-2">
                        - {review.full_name}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">Chưa có đánh giá</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal gallery phòng */}
      {showRoomGallery && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
          <button
            onClick={() => setShowRoomGallery(false)}
            className="absolute top-4 right-4 text-white text-3xl hover:text-gray-300 z-10"
          >
            ✕
          </button>

          <div className="max-w-5xl w-full">
            <div className="bg-black rounded-lg overflow-hidden mb-4">
              <img
                src={resolveAsset(currentRoomGallery[roomGalleryIdx])}
                alt={`Room ${roomGalleryIdx + 1}`}
                className="w-full max-h-[70vh] object-contain"
                onError={(e) => {
                  e.currentTarget.src =
                    "https://via.placeholder.com/800x600?text=Room";
                }}
              />
            </div>

            {currentRoomGallery.length > 1 && (
              <>
                <button
                  onClick={() =>
                    setRoomGalleryIdx(
                      (roomGalleryIdx - 1 + currentRoomGallery.length) %
                        currentRoomGallery.length
                    )
                  }
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-900 p-3 rounded-full text-2xl"
                >
                  ‹
                </button>
                <button
                  onClick={() =>
                    setRoomGalleryIdx(
                      (roomGalleryIdx + 1) % currentRoomGallery.length
                    )
                  }
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-900 p-3 rounded-full text-2xl"
                >
                  ›
                </button>
              </>
            )}

            <p className="text-white text-center text-sm">
              📷 Ảnh {roomGalleryIdx + 1} / {currentRoomGallery.length}
            </p>

            {currentRoomGallery.length > 1 && (
              <div className="flex gap-2 mt-4 overflow-x-auto justify-center">
                {currentRoomGallery.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setRoomGalleryIdx(i)}
                    className={`w-20 h-16 rounded overflow-hidden border-2 flex-shrink-0 ${
                      i === roomGalleryIdx
                        ? "border-blue-500"
                        : "border-white/30"
                    }`}
                  >
                    <img
                      src={resolveAsset(img)}
                      alt={`Thumb ${i + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Booking Modal */}
      {showBookingModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-2xl font-bold mb-4">Đặt phòng</h3>
            <form onSubmit={handleSubmitBooking}>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">
                    Phòng: {selectedRoom?.room_type}
                  </p>
                  <p className="text-lg font-bold text-blue-600">
                    {selectedRoom ? formatPrice(selectedRoom.price) : ""} / đêm
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ngày nhận phòng
                  </label>
                  <input
                    type="date"
                    required
                    min={new Date().toISOString().split("T")[0]}
                    value={bookingData.check_in}
                    onChange={(e) =>
                      setBookingData({
                        ...bookingData,
                        check_in: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ngày trả phòng
                  </label>
                  <input
                    type="date"
                    required
                    min={
                      bookingData.check_in ||
                      new Date().toISOString().split("T")[0]
                    }
                    value={bookingData.check_out}
                    onChange={(e) =>
                      setBookingData({
                        ...bookingData,
                        check_out: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Số khách
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    max={selectedRoom?.capacity}
                    value={bookingData.guests}
                    onChange={(e) =>
                      setBookingData({
                        ...bookingData,
                        guests: parseInt(e.target.value) || 1,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Yêu cầu đặc biệt (tuỳ chọn)
                  </label>
                  <textarea
                    rows="3"
                    value={bookingData.special_requests}
                    onChange={(e) =>
                      setBookingData({
                        ...bookingData,
                        special_requests: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="Ví dụ: Giường đôi, tầng cao..."
                  />
                </div>

                {calculateNights() > 0 && (
                  <div className="bg-gray-50 p-4 rounded-md">
                    <div className="flex justify-between text-sm mb-2">
                      <span>Số đêm:</span>
                      <span className="font-semibold">
                        {calculateNights()} đêm
                      </span>
                    </div>
                    <div className="flex justify-between text-lg font-bold text-blue-600">
                      <span>Tổng tiền:</span>
                      <span>{formatPrice(calculateTotalPrice())}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowBookingModal(false)}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded-md"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md"
                >
                  Xác nhận đặt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
