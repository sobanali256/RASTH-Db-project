

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import PatientDashboard from "./pages/patient/PatientDashboard";
import PatientRecords from "./pages/patient/PatientRecords";
import PatientAppointments from "./pages/patient/PatientAppointments";
import PatientRatings from "./pages/patient/PatientRatings";
import DoctorDashboard from "./pages/doctor/DoctorDashboard";
import DoctorAppointments from "./pages/doctor/DoctorAppointments";
import DoctorPatients from "./pages/doctor/DoctorPatients";
import DoctorRatings from "./pages/doctor/DoctorRatings";
import AdminDashboard from "./pages/AdminDashboard";
import Messages from "./pages/Messages";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* Patient Routes */}
          <Route path="/dashboard/patient/:id" element={<PatientDashboard />} />
          <Route path="/patient-records" element={<PatientRecords />} />
          <Route path="/patient-appointments" element={<PatientAppointments />} />
          <Route path="/patient-ratings" element={<PatientRatings />} />
          
          {/* Doctor Routes */}
          <Route path="/dashboard/doctor/:id" element={<DoctorDashboard />} />
          <Route path="/doctor-dashboard" element={<DoctorDashboard />} /> {/* Keep for backward compatibility */}
          <Route path="/doctor-appointments" element={<DoctorAppointments />} />
          <Route path="/doctor-patients" element={<DoctorPatients />} />
          <Route path="/doctor-ratings" element={<DoctorRatings />} />
          
          {/* Admin Routes */}
          <Route path="/admin-dashboard" element={<AdminDashboard />} />
          
          {/* Shared Routes */}
          <Route path="/messages" element={<Messages />} />
          
          {/* Catch-all Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
