// src/components/ProtectedRoute.jsx
import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { getRole } from "../auth/mockAuth";
import { isAuthed } from "../auth/authStorage";

/**
 * Usage examples:
 *
 * 1) Wrap children:
 * <Route
 *   path="/user/*"
 *   element={
 *     <ProtectedRoute role="user">
 *       <UserLayout />
 *     </ProtectedRoute>
 *   }
 * />
 *
 * 2) As a wrapper route with Outlet:
 * <Route element={<ProtectedRoute role="admin" />}>
 *   <Route path="/admin" element={<AdminDashboard />} />
 * </Route>
 *
 * Props:
 * - role: "user" | "admin"  (single allowed role)
 * - roles: ["user","admin"] (allowed roles array)
 */
export default function ProtectedRoute({ role, roles, children }) {
  const location = useLocation();

  const authed = isAuthed();
  const currentRole = getRole(); // "user" | "admin" | null

  // Not logged in at all
  if (!authed || !currentRole) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // Role guard
  const allowedRoles = Array.isArray(roles)
    ? roles
    : role
    ? [role]
    : ["user", "admin"];

  if (!allowedRoles.includes(currentRole)) {
    // If user is logged as admin but tries user routes (or vice versa)
    const fallback = currentRole === "admin" ? "/admin" : "/user";
    return <Navigate to={fallback} replace />;
  }

  // Render wrapped children or nested routes
  return children ? children : <Outlet />;
}
