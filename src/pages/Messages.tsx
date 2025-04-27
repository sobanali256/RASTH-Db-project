
import { NavBar } from "@/components/layout/NavBar";
import { MessagingSystem } from "@/components/dashboard/MessagingSystem";
import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const Messages = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [userType, setUserType] = useState<"doctor" | "patient" | null>(null);

  useEffect(() => {
    const isAuthenticated = localStorage.getItem("isAuthenticated") === "true";
    const storedUserType = localStorage.getItem("userType");
    
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    
    if (storedUserType === "doctor" || storedUserType === "patient") {
      setUserType(storedUserType as "doctor" | "patient");
    } else {
      navigate("/login");
    }
  }, [navigate]);
  
  if (!userType) return null;
  
  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      <div className="container px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-1">Messages</h1>
          <p className="text-muted-foreground">
            Communicate securely with {userType === "doctor" ? "patients" : "doctors"}
          </p>
        </div>
        
        <MessagingSystem userType={userType} />
      </div>
    </div>
  );
};

export default Messages;
