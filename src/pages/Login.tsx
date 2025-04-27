
import { LoginForm } from "@/components/auth/LoginForm";
import { Hospital } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const Login = () => {
  const navigate = useNavigate();

      <LoginForm />

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center p-4">
      <div className="flex justify-center mb-8">
        <div className="flex items-center gap-2">
          <Hospital className="h-8 w-8 text-hospital-green" />
          <span className="text-2xl font-bold">RASTH</span>
        </div>
      </div>
      <LoginForm />
      <div className="mt-4 text-center">
        <p className="text-sm text-muted-foreground">
          New to RASTH?{" "}
          <Button 
            variant="link" 
            className="p-0 h-auto"
            onClick={() => navigate("/register")}
          >
            Create an account
          </Button>
        </p>
      </div>
      <p className="mt-8 text-center text-sm text-muted-foreground">
        RASTH - Connecting patients and healthcare providers seamlessly.
      </p>
    </div>
  );
};

export default Login;
