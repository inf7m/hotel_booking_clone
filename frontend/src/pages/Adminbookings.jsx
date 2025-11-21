import { useState, useEffect } from "react";
import api from "../utils/api";

export default function AdminBookings() {
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("newest");

  useEffect(() => {
    loadBookings();
  }, []);

  useEffect(() => {
    applyFilters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookings, filter, searchTerm, sortBy]);

  const loadBookings = async () => {
    try {
      setLoading(true);
      const response = await api.get("/bookings/all");
      setBookings(response.data.bookings || []);
    } catch (error) {
      console.error("Load bookings error:", error);
      alert("Không thể tải danh sách bookings");
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let result = [...bookings];

    // Filter by status
    if (filter !== "all") {
      result = result.filter((b) => b.status === filter);
    }

    // Search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (b) =>
          b.user_name?.toLowerCase().includes(term) ||
          b.user_email?.toLowerCase().includes(term) ||
          b.hotel_name?.toLowerCase().includes(term) ||
          b.room_type?.toLowerCase().includes(term)
      );
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === "newest") {
        return new Date(b.created_at) - new Date(a.created_at);
      } else if (sortBy === "oldest") {
        return new Date(a.created_at) - new Date(b.created_at);
      } else if (sortBy === "price_high") {
        return b.total_price - a.total_price;
      } else if (sortBy === "price_low") {
        return a.total_price - b.total_price;
      }
      return 0;
    });

    setFilteredBookings(result);
  };

  const handleQuickStatusChange = async (bookingId, newStatus) => {
    if (!window.confirm(`Xác nhận thay đổi trạng thái thành "${newStatus}"?`))
      return;

    try {
      await api.patch(`/admin/bookings/${bookingId}/quick-status`, {
        status: newStatus,
      });
      alert("Cập nhật trạng thái thành công!");
      loadBookings();
    } catch (error) {
      console.error("Update status error:", error);
      alert("Không thể cập nhật trạng thái");
    }
  };

  const handleDelete = async (bookingId) => {
    if (!window.confirm("Bạn có chắc muốn xóa booking này?")) return;

    try {
      await api.delete(`/bookings/${bookingId}`);
      alert("Xóa booking thành công!");
      loadBookings();
    } catch (error) {
      console.error("Delete booking error:", error);
      alert("Không thể xóa booking");
    }
  };

  const exportToCSV = () => {
    const headers = [
      "ID",
      "Khách hàng",
      "Email",
      "Khách sạn",
      "Phòng",
      "Check-in",
      "Check-out",
      "Tổng tiền",
      "Trạng thái",
    ];
    const rows = filteredBookings.map((b) => [
      b.id,
      `"${b.user_name || ""}"`,
      `"${b.user_email || ""}"`,
      `"${b.hotel_name || ""}"`,
      `"${b.room_type || ""}"`,
      new Date(b.check_in).toLocaleDateString("vi-VN"),
      new Date(b.check_out).toLocaleDateString("vi-VN"),
      b.total_price,
      b.status,
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.join(",")),
    ].join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `bookings_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("vi-VN");
  };

  const getStatusCounts = () => {
    return {
      all: bookings.length,
      pending: bookings.filter((b) => b.status === "pending").length,
      confirmed: bookings.filter((b) => b.status === "confirmed").length,
      cancelled: bookings.filter((b) => b.status === "cancelled").length,
      completed: bookings.filter((b) => b.status === "completed").length,
    };
  };

  const statusCounts = getStatusCounts();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Quản Lý Bookings</h1>
          <p className="text-gray-600 mt-2">
            Tổng số: {bookings.length} bookings
          </p>
        </div>

        {/* Filters & Actions */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          {/* Status Tabs */}
          <div className="flex flex-wrap gap-2 mb-4">
            <FilterTab
              label={`Tất cả (${statusCounts.all})`}
              active={filter === "all"}
              onClick={() => setFilter("all")}
            />
            <FilterTab
              label={`Chờ xác nhận (${statusCounts.pending})`}
              active={filter === "pending"}
              onClick={() => setFilter("pending")}
              color="yellow"
            />
            <FilterTab
              label={`Đã xác nhận (${statusCounts.confirmed})`}
              active={filter === "confirmed"}
              onClick={() => setFilter("confirmed")}
              color="green"
            />
            <FilterTab
              label={`Đã hủy (${statusCounts.cancelled})`}
              active={filter === "cancelled"}
              onClick={() => setFilter("cancelled")}
              color="red"
            />
            <FilterTab
              label={`Hoàn thành (${statusCounts.completed})`}
              active={filter === "completed"}
              onClick={() => setFilter("completed")}
              color="blue"
            />
          </div>

          {/* Search & Sort */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              type="text"
              placeholder="🔍 Tìm kiếm (tên, email, khách sạn...)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="col-span-2 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            >
              <option value="newest">Mới nhất</option>
              <option value="oldest">Cũ nhất</option>
              <option value="price_high">Giá cao → thấp</option>
              <option value="price_low">Giá thấp → cao</option>
            </select>
          </div>

          {/* Export Button */}
          <div className="mt-4 flex justify-end">
            <button
              onClick={exportToCSV}
              disabled={filteredBookings.length === 0}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              📊 Export CSV ({filteredBookings.length})
            </button>
          </div>
        </div>

        {/* Bookings Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Khách hàng
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Khách sạn
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Phòng
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ngày
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tổng tiền
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trạng thái
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Hành động
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredBookings.length === 0 ? (
                  <tr>
                    <td
                      colSpan="8"
                      className="px-6 py-8 text-center text-gray-500"
                    >
                      {searchTerm || filter !== "all"
                        ? "🔍 Không tìm thấy booking phù hợp"
                        : "📋 Chưa có booking nào"}
                    </td>
                  </tr>
                ) : (
                  filteredBookings.map((booking) => (
                    <tr
                      key={booking.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        #{booking.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm">
                          <div className="font-medium text-gray-900">
                            {booking.user_name || "—"}
                          </div>
                          <div className="text-gray-500 text-xs">
                            {booking.user_email || "—"}
                          </div>
                          {booking.user_phone && (
                            <div className="text-gray-400 text-xs">
                              {booking.user_phone}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {booking.hotel_name || "—"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div>{booking.room_type || "—"}</div>
                        {booking.room_number && (
                          <div className="text-xs text-gray-500">
                            #{booking.room_number}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div>{formatDate(booking.check_in)}</div>
                        <div className="text-xs">
                          → {formatDate(booking.check_out)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-blue-600">
                        {formatCurrency(booking.total_price)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusDropdown
                          currentStatus={booking.status}
                          bookingId={booking.id}
                          onChange={handleQuickStatusChange}
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => handleDelete(booking.id)}
                          className="text-red-600 hover:text-red-900 transition-colors"
                          title="Xóa booking"
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Results Summary */}
        {filteredBookings.length > 0 && (
          <div className="mt-4 text-center text-sm text-gray-600">
            Hiển thị{" "}
            <span className="font-semibold text-gray-900">
              {filteredBookings.length}
            </span>{" "}
            / {bookings.length} bookings
          </div>
        )}
      </div>
    </div>
  );
}

// Filter Tab Component
function FilterTab({ label, active, onClick, color = "blue" }) {
  const colorClasses = {
    blue: "bg-blue-100 text-blue-700 border-blue-300 hover:bg-blue-200",
    yellow:
      "bg-yellow-100 text-yellow-700 border-yellow-300 hover:bg-yellow-200",
    green: "bg-green-100 text-green-700 border-green-300 hover:bg-green-200",
    red: "bg-red-100 text-red-700 border-red-300 hover:bg-red-200",
  };

  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-lg border-2 transition-all font-medium text-sm ${
        active
          ? colorClasses[color]
          : "bg-white text-gray-600 border-gray-300 hover:border-gray-400 hover:bg-gray-50"
      }`}
    >
      {label}
    </button>
  );
}

// Status Dropdown Component
function StatusDropdown({ currentStatus, bookingId, onChange }) {
  const statusOptions = [
    { value: "pending", label: "Chờ xác nhận", color: "yellow" },
    { value: "confirmed", label: "Đã xác nhận", color: "green" },
    { value: "completed", label: "Hoàn thành", color: "blue" },
    { value: "cancelled", label: "Đã hủy", color: "red" },
  ];

  const currentOption = statusOptions.find(
    (opt) => opt.value === currentStatus
  );
  const colorClasses = {
    yellow: "bg-yellow-100 text-yellow-800 border-yellow-300",
    green: "bg-green-100 text-green-800 border-green-300",
    blue: "bg-blue-100 text-blue-800 border-blue-300",
    red: "bg-red-100 text-red-800 border-red-300",
  };

  return (
    <select
      value={currentStatus}
      onChange={(e) => onChange(bookingId, e.target.value)}
      className={`px-3 py-1 rounded border text-sm font-medium cursor-pointer transition-colors ${
        colorClasses[currentOption?.color] ||
        "bg-gray-100 text-gray-800 border-gray-300"
      }`}
    >
      {statusOptions.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}
