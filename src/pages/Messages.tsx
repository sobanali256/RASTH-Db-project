
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
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-blue-50 to-white">
      <NavBar />
      <div className="container px-4 py-4 max-w-full mx-auto flex-1 flex flex-col">
        <div className="mb-4 text-center md:text-left">
          <h1 className="text-4xl font-bold mb-2 text-blue-900 bg-clip-text text-transparent bg-gradient-to-r from-blue-800 to-blue-500">
            Messages
          </h1>
          <p className="text-blue-600 text-lg">
            Communicate securely with {userType === "doctor" ? "patients" : "doctors"}
          </p>
        </div>
        
        <div className="flex-1 flex overflow-hidden">
          <MessagingSystem userType={userType} />
        </div>
      </div>
    </div>
  );
};

export default Messages;
