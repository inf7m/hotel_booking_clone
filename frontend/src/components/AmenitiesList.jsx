// frontend/src/components/AmenitiesList.jsx
import React, { useMemo } from "react";

/**
 * Map keyword -> icon
 */
const ICON_RULES = [
  { keywords: ["pool", "swimming", "bể bơi"], icon: "🏊" },
  { keywords: ["wifi"], icon: "📶" },
  { keywords: ["airport", "shuttle", "đưa đón"], icon: "🚌" },
  { keywords: ["family", "gia đình"], icon: "👨‍👩‍👧" },
  { keywords: ["beachfront", "beach", "bãi biển"], icon: "🏖️" },
  { keywords: ["non-smoking", "không hút thuốc"], icon: "🚭" },
  { keywords: ["restaurant", "nhà hàng"], icon: "🍽️" },
  { keywords: ["room service", "dịch vụ phòng"], icon: "🛎️" },
  { keywords: ["24-hour", "24h", "24 giờ"], icon: "⏰" },
  { keywords: ["breakfast", "bữa sáng"], icon: "🥐" },
  { keywords: ["parking", "đỗ xe", "bãi đỗ"], icon: "🅿" },
];

function pickIcon(label) {
  const lower = label.toLowerCase();
  const found = ICON_RULES.find((rule) =>
    rule.keywords.some((k) => lower.includes(k))
  );
  return found ? found.icon : "✔️";
}

/**
 * Chuẩn hoá dữ liệu tiện nghi về dạng array<string>
 */
function normalizeAmenities(value) {
  if (!value) return [];

  if (Array.isArray(value)) {
    return value
      .map(String)
      .map((s) => s.trim())
      .filter(Boolean);
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return [];

    // Nếu là JSON array
    if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
      try {
        const arr = JSON.parse(trimmed);
        if (Array.isArray(arr)) {
          return arr
            .map(String)
            .map((s) => s.trim())
            .filter(Boolean);
        }
      } catch {
        // ignore, fallback dùng split(",")
      }
    }

    // "a, b, c"
    return trimmed
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }

  return [];
}

export default function AmenitiesList({
  amenities,
  title = "Tiện nghi phổ biến",
}) {
  const items = useMemo(() => normalizeAmenities(amenities), [amenities]);

  if (!items.length) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <h2 className="text-2xl font-bold mb-4">{title}</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-3">
        {items.map((label, idx) => {
          // Kiểm tra đơn giản: nếu 2 ký tự đầu tiên không phải chữ/số = có emoji
          const firstChar = label.trim().charAt(0);
          const secondChar = label.trim().charAt(1);
          const hasEmoji =
            !/[a-zA-Z0-9]/.test(firstChar) && !/[a-zA-Z0-9]/.test(secondChar);

          if (hasEmoji) {
            // Nếu đã có emoji, chỉ hiển thị label (không thêm icon nữa)
            return (
              <div key={idx} className="flex items-center gap-2 text-gray-800">
                <span className="text-sm">{label}</span>
              </div>
            );
          } else {
            // Nếu chưa có emoji, thêm icon tự động
            return (
              <div key={idx} className="flex items-center gap-2 text-gray-800">
                <span className="text-xl">{pickIcon(label)}</span>
                <span className="text-sm">{label}</span>
              </div>
            );
          }
        })}
      </div>
    </div>
  );
}
