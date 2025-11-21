import { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "./context/AuthContext";

export default function ProtectedRoute({ children }) {
  const { user, ready } = useContext(AuthContext);
  if (!ready) return null; // có thể thay bằng spinner
  if (!user) return <Navigate to="/login" replace />;
  return children;
}
