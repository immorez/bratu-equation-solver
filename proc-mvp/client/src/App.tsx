import { Routes, Route } from "react-router-dom";
import { AppLayout } from "@/components/layout/app-layout";

import LoginPage from "@/pages/login";
import RegisterPage from "@/pages/register";
import DashboardPage from "@/pages/dashboard";
import VendorListPage from "@/pages/vendors/vendor-list";
import VendorDetailPage from "@/pages/vendors/vendor-detail";
import VendorCreatePage from "@/pages/vendors/vendor-create";
import RfqListPage from "@/pages/rfqs/rfq-list";
import RfqCreatePage from "@/pages/rfqs/rfq-create";
import RfqDetailPage from "@/pages/rfqs/rfq-detail";
import AnalyticsPage from "@/pages/analytics";
import DiscoveryPage from "@/pages/discovery";
import DiscoveryJobDetailPage from "@/pages/discovery/job-detail";

export default function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Protected routes */}
      <Route element={<AppLayout />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/vendors" element={<VendorListPage />} />
        <Route path="/vendors/new" element={<VendorCreatePage />} />
        <Route path="/vendors/:id" element={<VendorDetailPage />} />
        <Route path="/rfqs" element={<RfqListPage />} />
        <Route path="/rfqs/new" element={<RfqCreatePage />} />
        <Route path="/rfqs/:id" element={<RfqDetailPage />} />
        <Route path="/discovery" element={<DiscoveryPage />} />
        <Route path="/discovery/:id" element={<DiscoveryJobDetailPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
      </Route>
    </Routes>
  );
}
