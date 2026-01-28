import type { JSX } from "react";
import { Navigate } from "react-router-dom";

interface Props {
  children: JSX.Element;
  role?: "user" | "admin";
}

export default function ProtectedRoute({ children, role }: Props) {
  const token = localStorage.getItem("accessToken");
  const userStr = localStorage.getItem("user");

  if (!token || !userStr) {
    return <Navigate to="/login" replace />;
  }

  const user = JSON.parse(userStr);

  if (role && user.role !== role) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
