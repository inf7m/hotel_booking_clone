import { useRef, useState } from "react";
import { resolveAsset } from "../utils/api";

export default function ImageUploaderMulti({
  uploadPath,
  values = [],
  onChange,
  label = "Ảnh (nhiều)",
  max = 10,
}) {
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [urlText, setUrlText] = useState("");

  const openPicker = () => inputRef.current?.click();
  const removeAt = (idx) => onChange?.(values.filter((_, i) => i !== idx));

  const addUrls = () => {
    const pieces = urlText
      .split(/\n|,/g)
      .map((s) => s.trim())
      .filter(Boolean);
    if (!pieces.length) return;
    // gộp + cắt theo max
    const set = new Set([...(values || []), ...pieces]);
    onChange?.(Array.from(set).slice(0, max));
    setUrlText("");
  };

  const handleFiles = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setBusy(true);
    const base = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
    const multiUrl = `${base}/api${uploadPath}`;
    const singleUrl = multiUrl.replace(/-images$/, "-image");

    try {
      // thử endpoint MULTI
      const fd = new FormData();
      [...files].forEach((f) => fd.append("images", f));
      let res = await fetch(multiUrl, {
        method: "POST",
        body: fd,
        credentials: "include",
      });

      if (!res.ok) {
        // fallback: upload từng ảnh vào /upload-image
        const uploaded = [];
        for (const f of [...files]) {
          const fd1 = new FormData();
          fd1.append("image", f);
          const r = await fetch(singleUrl, {
            method: "POST",
            body: fd1,
            credentials: "include",
          });
          if (!r.ok) throw new Error("Upload thất bại");
          const d = await r.json();
          uploaded.push(d.url || d.absoluteUrl);
        }
        const set = new Set([...(values || []), ...uploaded]);
        onChange?.(Array.from(set).slice(0, max));
      } else {
        const data = await res.json();
        const urls = data.urls || data.absolute || [];
        const set = new Set([...(values || []), ...urls]);
        onChange?.(Array.from(set).slice(0, max));
      }
    } catch (err) {
      alert(err?.message || "Upload thất bại");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>

      <div className="flex items-center gap-3 mb-2">
        <button
          type="button"
          onClick={openPicker}
          disabled={busy || values.length >= max}
          className="px-3 py-2 bg-white border rounded-md shadow-sm hover:bg-gray-50 disabled:opacity-50"
        >
          {busy ? "Đang tải..." : "Chọn ảnh"}
        </button>
        <span className="text-sm text-gray-500">
          {values.length}/{max}
        </span>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFiles}
      />

      {/* Dán nhiều URL (1 ô duy nhất ở component này) */}
      <div className="flex gap-2 mb-3">
        <input
          placeholder="Dán nhiều URL, cách nhau bằng dấu phẩy hoặc xuống dòng"
          value={urlText}
          onChange={(e) => setUrlText(e.target.value)}
          className="flex-1 border rounded p-2"
        />
        <button
          type="button"
          onClick={addUrls}
          className="px-3 py-2 border rounded-md"
        >
          Thêm
        </button>
      </div>

      {values.length === 0 ? (
        <div className="text-gray-400 text-sm">Chưa có ảnh nào</div>
      ) : (
        <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
          {values.map((u, idx) => (
            <div key={idx} className="relative group">
              <img
                src={resolveAsset(u)}
                alt={"img-" + idx}
                className="w-full h-28 object-cover rounded-md border"
              />
              <button
                type="button"
                onClick={() => removeAt(idx)}
                className="absolute top-1 right-1 bg-black/60 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100"
                title="Xoá"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
