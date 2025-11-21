// frontend/src/components/AmenitiesSelector.jsx
import React from "react";

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

/**
 * Component cho phép chọn nhiều tiện nghi bằng checkbox
 * @param {Array} value - Mảng các tiện nghi đã chọn
 * @param {Function} onChange - Callback khi thay đổi danh sách tiện nghi
 */
export default function AmenitiesSelector({ value = [], onChange }) {
  const toggleAmenity = (label) => {
    const currentValues = Array.isArray(value) ? value : [];
    const exists = currentValues.includes(label);

    let newValues;
    if (exists) {
      // Bỏ chọn
      newValues = currentValues.filter((a) => a !== label);
    } else {
      // Chọn thêm
      newValues = [...currentValues, label];
    }

    onChange(newValues);
  };

  const currentValues = Array.isArray(value) ? value : [];

  return (
    <div className="border rounded-lg p-4 bg-gray-50">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {AMENITIES_OPTIONS.map((label) => {
          const isChecked = currentValues.includes(label);

          return (
            <label
              key={label}
              className={`flex items-center gap-2 p-2 rounded cursor-pointer transition ${
                isChecked
                  ? "bg-blue-50 border border-blue-300"
                  : "bg-white border border-gray-200 hover:border-blue-200"
              }`}
            >
              <input
                type="checkbox"
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                checked={isChecked}
                onChange={() => toggleAmenity(label)}
              />
              <span className="text-sm text-gray-700">{label}</span>
            </label>
          );
        })}
      </div>

      {currentValues.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <p className="text-xs text-gray-600">
            ✅ Đã chọn: <strong>{currentValues.length}</strong> tiện nghi
          </p>
        </div>
      )}
    </div>
  );
}
