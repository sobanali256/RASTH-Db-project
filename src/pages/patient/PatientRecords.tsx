
import { NavBar } from "@/components/layout/NavBar";
import { PatientRecords as PatientRecordsComponent } from "@/components/dashboard/PatientRecords";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const PatientRecordsPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is authenticated and the right type
    const isAuthenticated = localStorage.getItem("isAuthenticated") === "true";
    const userType = localStorage.getItem("userType");
    
    if (!isAuthenticated || userType !== "patient") {
      navigate("/login");
    }
  }, [navigate]);
  
  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      <div className="container px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-1">Medical Records</h1>
          <p className="text-muted-foreground">
            View and manage your health information
          </p>
        </div>
        
        <PatientRecordsComponent userType="patient" />
      </div>
    </div>
  );
};

export default PatientRecordsPage;
