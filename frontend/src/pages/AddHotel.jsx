// frontend/src/pages/AddHotel.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api, { resolveAsset } from "../utils/api";

// Danh sách tiện nghi phổ biến (icon + text)
const AMENITIES_OPTIONS = [
  "🏊 2 swimming pools",
  "🅿 Free parking",
  "🚭 Non-smoking rooms",
  "⏰ 24-hour front desk",
  "📶 Free WiFi",
  "👨‍👩‍👧 Family rooms",
  "🍽 Restaurant",
  "🥐 Superb breakfast",
  "🚌 Airport shuttle",
  "🏖 Beachfront",
  "🛎 Room service",
];

export default function AddHotel() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    city: "",
    address: "",
    description: "",
    rating: 0,
    image_url: "",
    amenitiesText: "", // tiện nghi nhập thêm (text)
    amenitiesSelected: [], // tiện nghi tick sẵn
  });

  const [uploading, setUploading] = useState(false);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: value }));
  };

  const toggleAmenity = (label) => {
    setForm((s) => {
      const exists = s.amenitiesSelected.includes(label);
      if (exists) {
        return {
          ...s,
          amenitiesSelected: s.amenitiesSelected.filter((a) => a !== label),
        };
      }
      return { ...s, amenitiesSelected: [...s.amenitiesSelected, label] };
    });
  };

  const uploadImage = async (file) => {
    if (!file) return;
    try {
      setUploading(true);
      const fd = new FormData();
      fd.append("image", file);
      const res = await api.post("/hotels/upload-image", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      // BE trả về { url: "/uploads/..." }
      setForm((s) => ({ ...s, image_url: res.data.url }));
    } catch (err) {
      alert(err.response?.data?.message || "Upload ảnh thất bại");
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      // tiện nghi nhập thêm (text)
      const manualAmenities = form.amenitiesText
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean);

      // gộp tiện nghi tick + tiện nghi nhập thêm, loại trùng
      const amenities = Array.from(
        new Set([...form.amenitiesSelected, ...manualAmenities])
      );

      await api.post("/hotels/add", {
        name: form.name,
        city: form.city,
        address: form.address,
        description: form.description,
        rating: Number(form.rating) || 0,
        image_url: form.image_url,
        amenities,
      });

      alert("Thêm khách sạn thành công!");
      navigate("/admin/hotels");
    } catch (err) {
      alert(err.response?.data?.message || "Có lỗi xảy ra");
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-2xl shadow p-6">
        <h1 className="text-2xl font-bold mb-6">➕ Thêm khách sạn mới</h1>

        <form
          onSubmit={onSubmit}
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          {/* Tên khách sạn */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700">
              Tên khách sạn
            </label>
            <input
              name="name"
              value={form.name}
              onChange={onChange}
              required
              className="mt-1 w-full rounded-lg border-gray-300 focus:ring-2 focus:ring-blue-500 px-3 py-2"
              placeholder="VD: Khách sạn Hoàng Gia"
            />
          </div>

          {/* Thành phố */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Thành phố
            </label>
            <input
              name="city"
              value={form.city}
              onChange={onChange}
              required
              className="mt-1 w-full rounded-lg border-gray-300 focus:ring-2 focus:ring-blue-500 px-3 py-2"
              placeholder="TP.HCM, Hà Nội, Nha Trang…"
            />
          </div>

          {/* Địa chỉ */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Địa chỉ
            </label>
            <input
              name="address"
              value={form.address}
              onChange={onChange}
              className="mt-1 w-full rounded-lg border-gray-300 focus:ring-2 focus:ring-blue-500 px-3 py-2"
              placeholder="Số nhà/đường/phường…"
            />
          </div>

          {/* Mô tả */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700">
              Mô tả
            </label>
            <textarea
              name="description"
              value={form.description}
              onChange={onChange}
              rows={4}
              className="mt-1 w-full rounded-lg border-gray-300 focus:ring-2 focus:ring-blue-500 px-3 py-2"
              placeholder="Giới thiệu ngắn gọn về khách sạn…"
            />
          </div>

          {/* Đánh giá */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Đánh giá (0–5)
            </label>
            <input
              type="number"
              min="0"
              max="5"
              step="0.1"
              name="rating"
              value={form.rating}
              onChange={onChange}
              className="mt-1 w-full rounded-lg border-gray-300 focus:ring-2 focus:ring-blue-500 px-3 py-2"
              placeholder="4.5"
            />
            <p className="mt-1 text-xs text-gray-400">
              Điểm đánh giá dự kiến (có thể để 0 nếu chưa rõ).
            </p>
          </div>

          {/* Tiện nghi phổ biến */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tiện nghi phổ biến
            </label>
            <div className="grid grid-cols-2 gap-2 border rounded-lg p-3 bg-gray-50">
              {AMENITIES_OPTIONS.map((label) => (
                <label
                  key={label}
                  className="flex items-center gap-2 text-xs text-gray-700"
                >
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    checked={form.amenitiesSelected.includes(label)}
                    onChange={() => toggleAmenity(label)}
                  />
                  <span>{label}</span>
                </label>
              ))}
            </div>
            <p className="mt-1 text-[11px] text-gray-400">
              Chọn / bỏ chọn tiện nghi. Dữ liệu sẽ được dùng cho tìm kiếm, lọc
              sau này.
            </p>
          </div>

          {/* Ảnh khách sạn: upload hoặc URL */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ảnh khách sạn
            </label>
            <div className="flex items-center gap-4">
              {/* Preview */}
              <div className="w-40 h-28 rounded-md bg-gray-100 overflow-hidden flex items-center justify-center border">
                {form.image_url ? (
                  <img
                    src={resolveAsset(form.image_url)}
                    alt="preview"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src =
                        "https://via.placeholder.com/300x200?text=No+Image";
                    }}
                  />
                ) : (
                  <span className="text-gray-400 text-sm">Chưa có ảnh</span>
                )}
              </div>

              {/* Actions */}
              <div className="flex-1 space-y-2">
                {/* Upload file */}
                <label className="inline-block px-4 py-2 bg-white border rounded-md shadow-sm hover:bg-gray-50 cursor-pointer text-sm">
                  {uploading ? "Đang tải..." : "Chọn ảnh từ máy"}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => uploadImage(e.target.files?.[0])}
                    disabled={uploading}
                  />
                </label>

                {/* Or paste URL */}
                <div className="text-xs text-gray-500">Hoặc dán URL ảnh:</div>
                <input
                  type="text"
                  name="image_url"
                  value={form.image_url}
                  onChange={onChange}
                  placeholder="https://example.com/hotel.jpg"
                  className="w-full rounded-md border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500">
                  • Nếu upload, hệ thống tự điền đường dẫn.
                  <br />• Nếu dán link (HTTPS), sẽ dùng trực tiếp làm ảnh bìa.
                </p>
              </div>
            </div>
          </div>

          {/* Tiện nghi khác (text) */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700">
              Tiện nghi khác (nhập thêm, cách nhau bởi dấu phẩy)
            </label>
            <input
              name="amenitiesText"
              value={form.amenitiesText}
              onChange={onChange}
              className="mt-1 w-full rounded-lg border-gray-300 focus:ring-2 focus:ring-blue-500 px-3 py-2 text-sm"
              placeholder="Spa, Rooftop bar, Phòng gym 24/7…"
            />
          </div>

          {/* Buttons */}
          <div className="md:col-span-2">
            <button
              type="submit"
              className="w-full md:w-auto px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              disabled={uploading}
            >
              Lưu khách sạn
            </button>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="ml-3 px-4 py-2 border rounded-lg"
            >
              Hủy
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
