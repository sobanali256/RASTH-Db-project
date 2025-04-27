
import { NavBar } from "@/components/layout/NavBar";
import { DoctorRating } from "@/components/dashboard/DoctorRating";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const PatientRatings = () => {
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
          <h1 className="text-3xl font-bold mb-1">Doctor Ratings & Feedback</h1>
          <p className="text-muted-foreground">
            Rate your doctors and view their ratings
          </p>
        </div>
        
        <DoctorRating />
      </div>
    </div>
  );
};

export default PatientRatings;
