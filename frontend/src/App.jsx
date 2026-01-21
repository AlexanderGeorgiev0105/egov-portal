import { Routes, Route, Navigate } from "react-router-dom";
import MainLayout from "./components/Layout/MainLayout";

import ProtectedRoute from "./components/ProtectedRoute";
import { getRole } from "./auth/mockAuth";

// ✅ UiAlertProvider (добавено)
import { UiAlertProvider } from "./ui/UiAlertProvider";

// User pages
import UserDashboard from "./pages/user/dashboard/UserDashboard";
import CategoriesPage from "./pages/user/services/CategoriesPage";
import ServicesByCategoryPage from "./pages/user/services/ServicesByCategoryPage";
import ServiceDetailsPage from "./pages/user/services/ServiceDetailsPage";
import MyRequestsPage from "./pages/user/dashboard/MyRequestsPage";
import PersonalDataPage from "./pages/user/profile/PersonalDataPage";

// ✅ Documents (User)
import DocumentsPage from "./pages/user/documents/DocumentsPage";
import AddDocumentPage from "./pages/user/documents/AddDocumentPage";
import DocumentDetailsPage from "./pages/user/documents/DocumentDetailsPage";

// ✅ Property (User)
import PropertyPage from "./pages/user/property/PropertyPage";
import AddPropertyPage from "./pages/user/property/AddPropertyPage";
import PropertyDetailsPage from "./pages/user/property/PropertyDetailsPage";
import PropertyTaxAssessmentPage from "./pages/user/property/PropertyTaxAssessmentPage";
import PropertySketchPage from "./pages/user/property/PropertySketchPage";
import PropertyDebtsPage from "./pages/user/property/PropertyDebtsPage";

// ✅ Health (User)
import HealthPage from "./pages/user/health/HealthPage";
import AddPersonalDoctorPage from "./pages/user/health/AddPersonalDoctorPage";
import PersonalDoctorDetailsPage from "./pages/user/health/PersonalDoctorDetailsPage";
import HealthAppointmentsPage from "./pages/user/health/HealthAppointmentsPage";
import HealthReferralsPage from "./pages/user/health/HealthReferralsPage";
import HealthRequestsPage from "./pages/user/health/HealthRequestsPage";

// ✅ Transport (User)
import VehiclesHubPage from "./pages/user/transport/VehiclesHubPage";
import MyVehiclesPage from "./pages/user/transport/MyVehiclesPage";
import AddVehiclePage from "./pages/user/transport/AddVehiclePage";
import VehicleDetailsPage from "./pages/user/transport/VehicleDetailsPage";
import VignettesPage from "./pages/user/transport/VignettesPage";
import TechnicalInspectionPage from "./pages/user/transport/TechnicalInspectionPage";
import FinesPage from "./pages/user/transport/FinesPage";

// ✅ Reports (User)
import ReportProblemHubPage from "./pages/user/reports/ReportProblemHubPage";
import ReportProblemCreatePage from "./pages/user/reports/ReportProblemCreatePage";

// Admin pages
import AdminDashboard from "./pages/admin/dashboard/AdminDashboard";
import AdminRequestsPage from "./pages/admin/requests/AdminRequestsPage";
import AdminRegisterRequestsPage from "./pages/admin/requests/AdminRegisterRequestsPage";

// ✅ Documents (Admin)
import AdminDocumentRequestsPage from "./pages/admin/documents/AdminDocumentRequestsPage";
import AdminDocumentRequestDetailsPage from "./pages/admin/documents/AdminDocumentRequestDetailsPage";

// ✅ Property (Admin)
import AdminPropertyRequestsPage from "./pages/admin/property/AdminPropertyRequestsPage";
import AdminPropertyRequestDetailsPage from "./pages/admin/property/AdminPropertyRequestDetailsPage";

// ✅ Health (Admin)
import AdminHealthPage from "./pages/admin/health/AdminHealthPage";
import AdminHealthRequestsPage from "./pages/admin/health/AdminHealthRequestsPage";
import AdminHealthRequestDetailsPage from "./pages/admin/health/AdminHealthRequestDetailsPage";

// ✅ Transport (Admin)
import AdminTransportPage from "./pages/admin/transport/AdminTransportPage";
import AdminAddFinePage from "./pages/admin/transport/AdminAddFinePage";
import AdminTransportRequestsPage from "./pages/admin/transport/AdminTransportRequestsPage";
import AdminTransportRequestDetailsPage from "./pages/admin/transport/AdminTransportRequestDetailsPage";

// ✅ Reports (Admin)
import AdminReportsPage from "./pages/admin/reports/AdminReportsPage";

// Public pages
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";

function RootRedirect() {
  const role = getRole();
  if (role === "admin") return <Navigate to="/admin" replace />;
  if (role === "user") return <Navigate to="/user" replace />;
  return <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <UiAlertProvider>
      <Routes>
        {/* Public */}
        <Route path="/" element={<LoginPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* User */}
        <Route
          path="/user"
          element={
            <ProtectedRoute allow={["user"]}>
              <MainLayout role="user" />
            </ProtectedRoute>
          }
        >
          <Route index element={<UserDashboard />} />
          <Route path="personal-data" element={<PersonalDataPage />} />
          <Route path="categories" element={<CategoriesPage />} />
          <Route path="categories/:id/services" element={<ServicesByCategoryPage />} />
          <Route path="services/:id" element={<ServiceDetailsPage />} />
          <Route path="my-requests" element={<MyRequestsPage />} />

          {/* ✅ Documents routes */}
          <Route path="documents" element={<DocumentsPage />} />
          <Route path="documents/add" element={<AddDocumentPage />} />
          <Route path="documents/details/:id" element={<DocumentDetailsPage />} />

          {/* ✅ Property routes */}
          <Route path="property" element={<PropertyPage />} />
          <Route path="property/add" element={<AddPropertyPage />} />
          <Route path="property/details/:id" element={<PropertyDetailsPage />} />
          <Route path="property/tax" element={<PropertyTaxAssessmentPage />} />
          <Route path="property/sketch" element={<PropertySketchPage />} />
          <Route path="property/debts" element={<PropertyDebtsPage />} />

          {/* ✅ Health routes */}
          <Route path="health" element={<HealthPage />} />
          <Route path="health/add-doctor" element={<AddPersonalDoctorPage />} />
          <Route path="health/doctor" element={<PersonalDoctorDetailsPage />} />
          <Route path="health/appointments" element={<HealthAppointmentsPage />} />
          <Route path="health/referrals" element={<HealthReferralsPage />} />
          <Route path="health/requests" element={<HealthRequestsPage />} />

          {/* ✅ Transport routes */}
          <Route path="vehicles" element={<VehiclesHubPage />} />
          <Route path="vehicles/my" element={<MyVehiclesPage />} />
          <Route path="vehicles/add" element={<AddVehiclePage />} />
          <Route path="vehicles/:vehicleId" element={<VehicleDetailsPage />} />
          <Route path="vehicles/vignettes" element={<VignettesPage />} />
          <Route path="vehicles/inspection" element={<TechnicalInspectionPage />} />
          <Route path="vehicles/fines" element={<FinesPage />} />

          {/* ✅ Reports routes */}
          <Route path="reports" element={<ReportProblemHubPage />} />
          <Route path="reports/new/:category" element={<ReportProblemCreatePage />} />
        </Route>

        {/* Admin */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allow={["admin"]}>
              <MainLayout role="admin" />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="requests" element={<AdminRequestsPage />} />
          <Route path="register-requests" element={<AdminRegisterRequestsPage />} />

          {/* ✅ Documents (Admin) */}
          <Route path="document-requests" element={<AdminDocumentRequestsPage />} />
          <Route path="document-requests/:id" element={<AdminDocumentRequestDetailsPage />} />

          {/* ✅ Property requests (Admin) */}
          <Route path="property-requests" element={<AdminPropertyRequestsPage />} />
          <Route path="property-requests/:id" element={<AdminPropertyRequestDetailsPage />} />

          {/* ✅ Health (Admin) */}
          <Route path="health" element={<AdminHealthPage />} />
          <Route path="health-requests" element={<AdminHealthRequestsPage />} />
          <Route path="health-requests/:id" element={<AdminHealthRequestDetailsPage />} />

          {/* ✅ Transport (Admin) */}
          <Route path="transport" element={<AdminTransportPage />} />
          <Route path="transport/add-fine" element={<AdminAddFinePage />} />
          <Route path="transport/requests" element={<AdminTransportRequestsPage />} />
          <Route path="transport/requests/:id" element={<AdminTransportRequestDetailsPage />} />

          {/* ✅ Reports (Admin) */}
          <Route path="reports" element={<AdminReportsPage />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<RootRedirect />} />
      </Routes>
    </UiAlertProvider>
  );
}
