import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import api from "../utils/api";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444"];

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [revenueData, setRevenueData] = useState([]);
  const [topHotels, setTopHotels] = useState([]);
  const [statusData, setStatusData] = useState([]);
  const [recentBookings, setRecentBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [overview, revenue, hotels, status, recent] = await Promise.all([
        api.get("/admin/stats/overview"),
        api.get("/admin/stats/revenue-by-month"),
        api.get("/admin/stats/top-hotels"),
        api.get("/admin/stats/booking-status"),
        api.get("/admin/stats/recent-bookings?limit=5"),
      ]);

      setStats(overview.data.stats);
      setRevenueData(revenue.data.data);
      setTopHotels(hotels.data.data);
      setStatusData(status.data.data);
      setRecentBookings(recent.data.data);
    } catch (error) {
      console.error("Load dashboard error:", error);
      alert("Không thể tải dữ liệu dashboard");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount || 0);

  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString("vi-VN");

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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Dashboard Quản Trị
          </h1>
          <p className="text-gray-600 mt-2">Tổng quan và thống kê hệ thống</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Tổng Doanh Thu"
            value={formatCurrency(stats?.revenue?.total || 0)}
            subtitle={`Tháng này: ${formatCurrency(
              stats?.revenue?.month || 0
            )}`}
            bgColor="bg-gradient-to-br from-blue-500 to-blue-600"
            icon="💰"
          />
          <StatCard
            title="Tổng Bookings"
            value={stats?.bookings?.total || 0}
            subtitle={`Hôm nay: ${stats?.bookings?.today || 0}`}
            bgColor="bg-gradient-to-br from-green-500 to-green-600"
            icon="📅"
          />
          <StatCard
            title="Khách Sạn"
            value={stats?.hotels || 0}
            subtitle={`${stats?.rooms || 0} phòng`}
            bgColor="bg-gradient-to-br from-purple-500 to-purple-600"
            icon="🏨"
            to="/admin/hotels" // 👈 bấm vào card sẽ tới trang quản lý khách sạn
          />
          <StatCard
            title="Khách Hàng"
            value={stats?.users || 0}
            subtitle={`Chờ xác nhận: ${stats?.bookings?.pending || 0}`}
            bgColor="bg-gradient-to-br from-orange-500 to-orange-600"
            icon="👥"
          />
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Revenue Chart */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Doanh Thu Theo Tháng</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  name="Doanh thu"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Status Pie Chart */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Trạng Thái Booking</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ status, count }) => `${status}: ${count}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {statusData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Top Hotels Bar Chart */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Top 10 Khách Sạn</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topHotels}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="name"
                  angle={-45}
                  textAnchor="end"
                  height={100}
                />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="bookings" fill="#3b82f6" name="Số booking" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Recent Bookings */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Booking Gần Đây</h2>
              <Link
                to="/admin/bookings"
                className="text-blue-600 hover:underline text-sm"
              >
                Xem tất cả →
              </Link>
            </div>
            <div className="space-y-3">
              {recentBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="border-l-4 border-blue-500 pl-4 py-2"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{booking.hotel_name}</p>
                      <p className="text-sm text-gray-600">
                        {booking.user_name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatDate(booking.check_in)} →{" "}
                        {formatDate(booking.check_out)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-blue-600">
                        {formatCurrency(booking.total_price)}
                      </p>
                      <StatusBadge status={booking.status} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Truy Cập Nhanh</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <QuickActionButton
              to="/admin/bookings"
              icon="📋"
              label="Quản lý Bookings"
            />
            <QuickActionButton
              to="/admin/hotels"
              icon="🏨"
              label="Quản lý Khách sạn"
            />
            <QuickActionButton
              to="/admin/hotel/new"
              icon="➕"
              label="Thêm Khách sạn"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, subtitle, bgColor, icon, to }) {
  const content = (
    <div
      className={`${bgColor} rounded-lg shadow-lg p-6 text-white transform hover:scale-105 transition-transform`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm opacity-90">{title}</p>
          <p className="text-3xl font-bold mt-2">{value}</p>
          <p className="text-xs opacity-75 mt-1">{subtitle}</p>
        </div>
        <div className="text-4xl opacity-80">{icon}</div>
      </div>
    </div>
  );

  // nếu có to thì bọc Link để click được
  if (to) {
    return (
      <Link to={to} className="block focus:outline-none">
        {content}
      </Link>
    );
  }

  return content;
}

function StatusBadge({ status }) {
  const statusConfig = {
    pending: { label: "Chờ", color: "bg-yellow-100 text-yellow-800" },
    confirmed: { label: "Xác nhận", color: "bg-green-100 text-green-800" },
    cancelled: { label: "Hủy", color: "bg-red-100 text-red-800" },
    completed: { label: "Hoàn thành", color: "bg-blue-100 text-blue-800" },
  };

  const config = statusConfig[status] || {
    label: status,
    color: "bg-gray-100 text-gray-800",
  };

  return (
    <span className={`px-2 py-1 rounded text-xs font-medium ${config.color}`}>
      {config.label}
    </span>
  );
}

function QuickActionButton({ to, icon, label }) {
  return (
    <Link
      to={to}
      className="flex flex-col items-center justify-center p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all"
    >
      <span className="text-3xl mb-2">{icon}</span>
      <span className="text-sm font-medium text-gray-700">{label}</span>
    </Link>
  );
}
