import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";

import Header from "./components/Header";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import HotelDetail from "./pages/HotelDetail";
import MyBookings from "./pages/MyBookings";

import AdminDashboard from "./pages/AdminDashboard";
import AdminBookings from "./pages/Adminbookings";
import AdminHotels from "./pages/AdminHotels";
import AddHotel from "./pages/AddHotel";
import EditHotel from "./pages/EditHotel";
import HotelRooms from "./pages/HotelRooms";
import AddRoom from "./pages/AddRoom";

import DiscoverPage from "./pages/DiscoverPage";

function ProtectedRoute({ children, adminOnly = false }) {
  const { user, ready } = useAuth();

  if (!ready)
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin h-10 w-10 rounded-full border-b-2 border-blue-600" />
      </div>
    );

  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && user.role !== "admin") return <Navigate to="/" replace />;

  return children;
}

function AppContent() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <Routes>
        {/* Public */}
        <Route path="/" element={<Home />} />
        <Route path="/discover/:vibe" element={<DiscoverPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/hotels/:id" element={<HotelDetail />} />

        {/* User */}
        <Route
          path="/my-bookings"
          element={
            <ProtectedRoute>
              <MyBookings />
            </ProtectedRoute>
          }
        />

        {/* Admin */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute adminOnly>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        {/* ✅ THÊM ROUTE NÀY - Quản lý Bookings */}
        <Route
          path="/admin/bookings"
          element={
            <ProtectedRoute adminOnly>
              <AdminBookings />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/hotels"
          element={
            <ProtectedRoute adminOnly>
              <AdminHotels />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/hotel/new"
          element={
            <ProtectedRoute adminOnly>
              <AddHotel />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/hotel/edit/:id"
          element={
            <ProtectedRoute adminOnly>
              <EditHotel />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/hotel/:id/rooms"
          element={
            <ProtectedRoute adminOnly>
              <HotelRooms />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/hotel/:id/rooms/new"
          element={
            <ProtectedRoute adminOnly>
              <AddRoom />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}
