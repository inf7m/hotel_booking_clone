import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../utils/api";
import ImageUploaderMulti from "../components/ImageUploaderMulti";

export default function AddRoom() {
  // URL: /admin/hotel/:id/rooms/new  => param tên "id"
  const { id } = useParams();
  const hotelId = id;

  const navigate = useNavigate();

  const [form, setForm] = useState({
    roomNumber: "",
    roomType: "",
    capacity: 2,
    quantity: 1, // hiện chưa dùng trong BE
    price: 100000,
    description: "",
    amenitiesText: "",
  });

  const [photos, setPhotos] = useState([]); // mảng URL ảnh
  const [saving, setSaving] = useState(false);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const submit = async (e) => {
    e.preventDefault();

    if (!hotelId) {
      alert("Thiếu hotel_id khi tạo phòng");
      console.error("❌ Không có hotelId, params:", { id });
      return;
    }

    try {
      setSaving(true);

      const amenities = (form.amenitiesText || "")
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean);

      await api.post("/rooms", {
        hotel_id: hotelId, // ⭐ GỬI STRING
        room_number: form.roomNumber || null,
        room_type: form.roomType || form.roomNumber || "Room",
        price: Number(form.price) || 0,
        capacity: Number(form.capacity) || 0,
        description: form.description,
        image_url: photos[0] || "",
        image_urls: photos,
        amenities,
      });

      alert("Thêm phòng thành công");
      navigate(`/admin/hotel/${hotelId}/rooms`);
    } catch (err) {
      console.error("Create room error:", err);
      alert(err.response?.data?.message || "Lỗi tạo phòng");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-2xl shadow p-6 md:p-8">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="h-9 w-9 flex items-center justify-center rounded-full bg-purple-100 text-purple-600 text-2xl">
              +
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Thêm phòng</h1>
              {hotelId && (
                <p className="text-xs text-gray-500 mt-1">
                  Khách sạn ID: <span className="font-semibold">{hotelId}</span>
                </p>
              )}
            </div>
          </div>

          <form onSubmit={submit} className="space-y-6">
            {/* Số phòng + Loại phòng */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">
                  Số phòng
                </label>
                <input
                  name="roomNumber"
                  value={form.roomNumber}
                  onChange={onChange}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="VD: 303"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">
                  Loại phòng <span className="text-red-500">*</span>
                </label>
                <input
                  name="roomType"
                  required
                  value={form.roomType}
                  onChange={onChange}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="VD: Deluxe Double or Twin Room"
                />
              </div>
            </div>

            {/* Giá + Sức chứa */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">
                  Giá (VND) *
                </label>
                <input
                  type="number"
                  min="0"
                  name="price"
                  value={form.price}
                  onChange={onChange}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="VD: 1500000"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">
                  Sức chứa
                </label>
                <input
                  type="number"
                  min="1"
                  name="capacity"
                  value={form.capacity}
                  onChange={onChange}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Mô tả */}
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">
                Mô tả
              </label>
              <textarea
                rows={3}
                name="description"
                value={form.description}
                onChange={onChange}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Mô tả về phòng..."
              />
            </div>

            {/* Ảnh phòng */}
            <div className="space-y-2">
              <ImageUploaderMulti
                label="Album ảnh phòng (ảnh đầu tiên sẽ là ảnh bìa)"
                uploadPath="rooms"
                values={photos}
                onChange={setPhotos}
                max={10}
              />
            </div>

            {/* Tiện nghi (text) */}
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">
                Tiện nghi (phân cách bằng dấu phẩy)
              </label>
              <input
                name="amenitiesText"
                value={form.amenitiesText}
                onChange={onChange}
                placeholder="VD: King bed, City view, Smart TV, Mini bar"
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={() =>
                  hotelId
                    ? navigate(`/admin/hotel/${hotelId}/rooms`)
                    : navigate("/admin")
                }
                className="px-4 py-2 border rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 disabled:opacity-60"
              >
                {saving ? "Đang lưu..." : "Tạo phòng"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
