import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api, { resolveAsset } from "../utils/api";
import ImageUploaderMulti from "../components/ImageUploaderMulti";
import AmenitiesSelector from "../components/AmenitiesSelector";

export default function EditHotel() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    city: "",
    address: "",
    description: "",
    rating: 0,
    image_url: "",
    image_urls: [],
    amenities: [], // ✅ dùng mảng
  });

  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const res = await api.get(`/hotels/${id}`);
        if (!alive) return;

        const h = res.data?.hotel ?? {};
        console.log("📥 Data từ API:", h);

        // ✅ Parse amenities từ nhiều định dạng khác nhau
        let amenities = [];
        try {
          if (Array.isArray(h.amenities)) {
            amenities = h.amenities;
          } else if (typeof h.amenities === "string") {
            const trimmed = h.amenities.trim();
            if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
              const parsed = JSON.parse(trimmed);
              if (Array.isArray(parsed)) {
                amenities = parsed;
              } else {
                amenities = [];
              }
            } else if (trimmed) {
              amenities = trimmed
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean);
            }
          }
        } catch (e) {
          console.error("❌ Parse amenities error:", e);
          amenities = [];
        }

        // ✅ Parse image_urls
        let imageUrls = [];
        try {
          if (Array.isArray(h.image_urls)) {
            imageUrls = h.image_urls;
          } else if (typeof h.image_urls === "string" && h.image_urls) {
            const parsed = JSON.parse(h.image_urls);
            imageUrls = Array.isArray(parsed) ? parsed : [];
          }
        } catch (e) {
          console.error("❌ Error parsing image_urls:", e);
          imageUrls = [];
        }

        setForm({
          name: h.name || "",
          city: h.city || "",
          address: h.address || "",
          description: h.description || "",
          rating: Number(h.rating) || 0,
          image_url: h.image_url || "",
          image_urls: imageUrls,
          amenities, // ✅ set mảng tiện nghi
        });
      } catch (err) {
        console.error("❌ Lỗi load hotel:", err);
        alert(
          "Không thể tải thông tin khách sạn: " +
            (err?.response?.data?.message || err.message)
        );
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [id]);

  const onChange = (e) =>
    setForm((s) => ({ ...s, [e.target.name]: e.target.value }));

  const uploadCover = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("image", file);
      const res = await api.post("/hotels/upload-image", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      console.log("✅ Upload ảnh bìa thành công:", res.data);
      setForm((s) => ({ ...s, image_url: res.data.url }));
      alert("✅ Upload ảnh bìa thành công!");
    } catch (err) {
      console.error("❌ Upload ảnh bìa thất bại:", err);
      alert(err?.response?.data?.message || "Upload ảnh thất bại");
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();

    try {
      const ratingNum = Math.max(0, Math.min(5, parseFloat(form.rating) || 0));

      const imageUrlsArray = Array.isArray(form.image_urls)
        ? form.image_urls
        : [];

      const payload = {
        name: form.name,
        city: form.city,
        address: form.address,
        description: form.description,
        rating: ratingNum,
        image_url: form.image_url,
        image_urls: imageUrlsArray,
        amenities: form.amenities || [], // ✅ gửi mảng tiện nghi
      };

      console.log("=== 📤 DATA GỬI LÊN SERVER ===");
      console.log("Hotel ID:", id);
      console.log("Payload:", payload);

      const response = await api.put(`/hotels/${id}`, payload);

      console.log("=== ✅ RESPONSE TỪ SERVER ===");
      console.log(response.data);

      alert("Cập nhật khách sạn thành công ✅");
      navigate(`/hotels/${id}`);
    } catch (err) {
      console.error("=== ❌ LỖI CẬP NHẬT ===");
      console.error("Error object:", err);
      console.error("Response:", err?.response);
      console.error("Response data:", err?.response?.data);

      const errorMsg =
        err?.response?.data?.message || err.message || "Lỗi cập nhật khách sạn";
      const errorDetails =
        err?.response?.data?.error || err?.response?.data?.details || "";

      alert(
        `❌ ${errorMsg}\n\n` +
          (errorDetails ? `Chi tiết: ${errorDetails}\n\n` : "") +
          `Mở Console (F12) để xem log chi tiết.`
      );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-2xl shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">✏️ Sửa khách sạn</h1>
          <button
            onClick={() => {
              console.log("=== 🔍 DEBUG INFO ===");
              console.log("Current form state:", form);
            }}
            className="px-3 py-1 text-xs bg-gray-200 rounded hover:bg-gray-300"
            type="button"
          >
            🐛 Debug Log
          </button>
        </div>

        <form
          onSubmit={onSubmit}
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700">
              Tên khách sạn <span className="text-red-500">*</span>
            </label>
            <input
              name="name"
              value={form.name}
              onChange={onChange}
              required
              placeholder="Nhập tên khách sạn"
              className="mt-1 w-full rounded-lg border-gray-300 focus:ring-2 focus:ring-blue-500 px-4 py-2 border"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Thành phố <span className="text-red-500">*</span>
            </label>
            <input
              name="city"
              value={form.city}
              onChange={onChange}
              required
              placeholder="Ví dụ: Đà Nẵng"
              className="mt-1 w-full rounded-lg border-gray-300 focus:ring-2 focus:ring-blue-500 px-4 py-2 border"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Địa chỉ
            </label>
            <input
              name="address"
              value={form.address}
              onChange={onChange}
              placeholder="Số nhà, đường, phường..."
              className="mt-1 w-full rounded-lg border-gray-300 focus:ring-2 focus:ring-blue-500 px-4 py-2 border"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700">
              Mô tả
            </label>
            <textarea
              name="description"
              rows={4}
              value={form.description}
              onChange={onChange}
              placeholder="Mô tả về khách sạn..."
              className="mt-1 w-full rounded-lg border-gray-300 focus:ring-2 focus:ring-blue-500 px-4 py-2 border"
            />
          </div>

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
              className="mt-1 w-full rounded-lg border-gray-300 focus:ring-2 focus:ring-blue-500 px-4 py-2 border"
            />
            <p className="text-xs text-gray-500 mt-1">
              Điểm đánh giá từ 0.0 đến 5.0
            </p>
          </div>

          {/* Ảnh bìa */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ảnh bìa khách sạn <span className="text-red-500">*</span>
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
              <div className="flex items-center gap-4">
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
                    <span className="text-gray-400 text-sm text-center px-2">
                      Chưa có ảnh
                    </span>
                  )}
                </div>

                <div className="flex-1 space-y-2">
                  <label className="inline-block px-4 py-2 bg-blue-600 text-white rounded-md shadow-sm hover:bg-blue-700 cursor-pointer transition">
                    {uploading ? "Đang tải..." : "📤 Upload ảnh"}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => uploadCover(e.target.files?.[0])}
                      disabled={uploading}
                    />
                  </label>

                  <input
                    name="image_url"
                    placeholder="Hoặc dán URL ảnh bìa tại đây..."
                    value={form.image_url}
                    onChange={onChange}
                    className="w-full border rounded-md px-3 py-2 text-sm"
                  />
                  <p className="text-xs text-gray-500">
                    Ảnh bìa sẽ được hiển thị đầu tiên trong gallery
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Album nhiều ảnh */}
          <div className="md:col-span-2">
            <ImageUploaderMulti
              uploadPath="/hotels/upload-images"
              values={form.image_urls}
              onChange={(vals) => {
                console.log("📷 ImageUploaderMulti onChange:", vals);
                setForm((s) => ({ ...s, image_urls: vals }));
              }}
              label="Album ảnh khách sạn"
              max={10}
            />
            <p className="text-xs text-gray-500 mt-2">
              💡 Bạn có thể thêm tối đa 10 ảnh. Hiện có:{" "}
              {form.image_urls.length} ảnh
            </p>
          </div>

          {/* ✅ Chọn tiện nghi bằng checkbox */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tiện nghi phổ biến
            </label>
            <AmenitiesSelector
              value={form.amenities}
              onChange={(amenities) => setForm((s) => ({ ...s, amenities }))}
            />
            <p className="text-xs text-gray-500 mt-1">
              Chọn / bỏ chọn tiện nghi. Dữ liệu cũ dạng chuỗi vẫn được tự động
              chuyển thành danh sách.
            </p>
          </div>

          <div className="md:col-span-2 flex gap-3 pt-4 border-t">
            <button
              type="submit"
              className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={uploading}
            >
              💾 Lưu thay đổi
            </button>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-6 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            >
              ❌ Hủy
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
