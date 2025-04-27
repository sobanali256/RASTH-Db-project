
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Hospital } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PatientRegistrationForm } from "@/components/auth/PatientRegistrationForm";
import { DoctorRegistrationForm } from "@/components/auth/DoctorRegistrationForm";

const Register = () => {
  const [userType, setUserType] = useState<string>("patient");
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center p-4">
      <div className="flex justify-center mb-8">
        <div className="flex items-center gap-2">
          <Hospital className="h-8 w-8 text-hospital-green" />
          <span className="text-2xl font-bold">RASTH</span>
        </div>
      </div>
      
      <div className="w-full max-w-md mx-auto">
        <Tabs defaultValue="patient" onValueChange={setUserType}>
          <TabsList className="grid grid-cols-2 mb-6">
            <TabsTrigger value="patient">Patient Registration</TabsTrigger>
            <TabsTrigger value="doctor">Doctor Registration</TabsTrigger>
          </TabsList>
          <TabsContent value="patient">
            <PatientRegistrationForm />
          </TabsContent>
          <TabsContent value="doctor">
            <DoctorRegistrationForm />
          </TabsContent>
        </Tabs>
      </div>
      
      <div className="mt-6 text-center">
        <p className="text-sm text-muted-foreground">
          Already have an account?{" "}
          <button 
            className="text-hospital-blue hover:underline font-medium"
            onClick={() => navigate("/login")}
          >
            Login
          </button>
        </p>
      </div>
      
      <p className="mt-8 text-center text-sm text-muted-foreground">
        RASTH - Connecting patients and healthcare providers seamlessly.
      </p>
    </div>
  );
};

export default Register;
