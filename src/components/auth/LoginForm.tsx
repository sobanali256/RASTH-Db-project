
import api from "@/services/api";

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

interface LoginResponse {
  token: string;
  userType: string;
  userId: number;
  message?: string;
}

export function LoginForm() {
  const [userType, setUserType] = useState<string>("patient");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate inputs
    if (!email || !password) {
      toast.error("Please enter both email and password");
      return;
    }
    
    try {
      // Use the API service for real authentication
      const response = await api.login({ email, password });
      
      toast.success(`Logged in successfully`);
      
      // Redirect based on user type and ID
      if (response.userType === "doctor") {
        navigate(`/dashboard/doctor/${response.userId}`);
      } else if (response.userType === "patient") {
        navigate(`/dashboard/patient/${response.userId}`);
      } else if (response.userType === "admin") {
        navigate("/admin-dashboard"); // Redirect admin to admin dashboard
      } else {
        // Fallback or handle unexpected user types
        toast.error("Unknown user type received. Please contact support.");
        navigate("/login");
      }
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl text-center">Welcome to RASTH</CardTitle>
        <CardDescription className="text-center">
          Sign in to your account to continue
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="patient" onValueChange={setUserType}>
          <TabsList className="grid grid-cols-3 mb-6">
            <TabsTrigger value="patient">Patient</TabsTrigger>
            <TabsTrigger value="doctor">Doctor</TabsTrigger>
            <TabsTrigger value="admin">Admin</TabsTrigger>
          </TabsList>
          <TabsContent value="patient">
            <form onSubmit={handleLogin}>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="patient-email">Email</Label>
                  <Input 
                    id="patient-email" 
                    type="email" 
                    placeholder="you@example.com" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="patient-password">Password</Label>
                    <Button variant="link" className="p-0 h-auto text-xs">
                      Forgot password?
                    </Button>
                  </div>
                  <Input 
                    id="patient-password" 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <Button type="submit" className="w-full bg-hospital-blue hover:bg-blue-700">Login</Button>
              </div>
            </form>
          </TabsContent>
          <TabsContent value="doctor">
            <form onSubmit={handleLogin}>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="doctor-email">Email</Label>
                  <Input 
                    id="doctor-email" 
                    type="email" 
                    placeholder="doctor@hospital.com" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="doctor-password">Password</Label>
                    <Button variant="link" className="p-0 h-auto text-xs">
                      Forgot password?
                    </Button>
                  </div>
                  <Input 
                    id="doctor-password" 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <Button type="submit" className="w-full bg-hospital-green hover:bg-green-700">Login</Button>
              </div>
            </form>
          </TabsContent>
          <TabsContent value="admin">
            <form onSubmit={handleLogin}>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="admin-email">Email</Label>
                  <Input 
                    id="admin-email" 
                    type="email" 
                    placeholder="admin@example.com" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="admin-password">Password</Label>
                    {/* Optional: Add forgot password link for admin */}
                  </div>
                  <Input 
                    id="admin-password" 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <Button type="submit" className="w-full bg-gray-700 hover:bg-gray-800 text-white">Admin Login</Button>
              </div>
            </form>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="flex justify-center">
        <p className="text-sm text-muted-foreground">
          Don't have an account? <Button variant="link" className="p-0 h-auto" onClick={() => navigate("/register")}>Register</Button>
        </p>
      </CardFooter>
    </Card>
  );
}
