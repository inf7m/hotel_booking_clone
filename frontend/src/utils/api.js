import axios from "axios";

export const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const api = axios.create({
  baseURL: `${API_BASE}/api`,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      const publicPaths = ["/", "/login", "/register"];
      if (!publicPaths.includes(window.location.pathname)) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export function resolveAsset(url) {
  if (!url) return "";
  if (/^https?:\/\//i.test(url)) return url;
  if (url.startsWith("/")) return `${API_BASE}${url}`;
  return `${API_BASE}/${url}`;
}

/* ---------------- Hotels ---------------- */
export const hotelAPI = {
  getAll: (params = {}) => api.get(`/hotels`, { params }),
  search: (params = {}) => api.get(`/hotels/search`, { params }),
  getById: (id) => api.get(`/hotels/${id}`),
  getCities: () => api.get("/hotels/cities/list"),

  create: (data) => api.post("/hotels/add", data),
  update: (id, data) => api.put(`/hotels/${id}`, data),
  delete: (id) => api.delete(`/hotels/${id}`),

  // uploads
  uploadImage: (file) => {
    const fd = new FormData();
    fd.append("image", file);
    return api.post("/hotels/upload-image", fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  uploadImages: (files /* FileList|File[] */) => {
    const fd = new FormData();
    [...files].forEach((f) => fd.append("images", f));
    return api.post("/hotels/upload-images", fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
};

/* ---------------- Auth ---------------- */
export const authAPI = {
  login: (credentials) => api.post("/auth/login", credentials),
  register: (userData) => api.post("/auth/register", userData),
  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    return Promise.resolve();
  },
  getCurrentUser: () => api.get("/auth/me"),
  updateProfile: (userData) => api.put("/auth/profile", userData),
  changePassword: (pwdData) => api.post("/auth/change-password", pwdData),
};

/* ---------------- Rooms ---------------- */
export const roomAPI = {
  getByHotelId: (hotelId, params = {}) =>
    api.get(`/rooms/hotel/${hotelId}`, { params }),
  getById: (id) => api.get(`/rooms/${id}`),

  create: (data) => api.post("/rooms", data),
  update: (id, data) => api.put(`/rooms/${id}`, data),
  delete: (id) => api.delete(`/rooms/${id}`),

  // uploads (để dùng cho ảnh bìa & album)
  uploadImage: (file) => {
    const fd = new FormData();
    fd.append("image", file);
    return api.post("/rooms/upload-image", fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  uploadImages: (files) => {
    const fd = new FormData();
    [...files].forEach((f) => fd.append("images", f));
    return api.post("/rooms/upload-images", fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
};

/* ---------------- Helpers ---------------- */
export const helpers = {
  formatPrice: (price) =>
    price || price === 0
      ? new Intl.NumberFormat("vi-VN", {
          style: "currency",
          currency: "VND",
        }).format(price)
      : "Liên hệ",
  formatDate: (date) =>
    date
      ? new Date(date).toLocaleDateString("vi-VN", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      : "",
  formatDateTime: (date) =>
    date
      ? new Date(date).toLocaleString("vi-VN", {
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "",
  calculateDays: (checkIn, checkOut) =>
    Math.ceil(
      Math.abs(new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24)
    ),
  isAuthenticated: () => !!localStorage.getItem("token"),
  getUser: () => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  },
  isAdmin: () => helpers.getUser()?.role === "admin",
};

export default api;
