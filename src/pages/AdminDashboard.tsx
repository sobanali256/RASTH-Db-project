
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { NavBar } from "@/components/layout/NavBar";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { CheckCircle, XCircle, User, UserCog, Activity, Users, ClipboardList } from "lucide-react";
import { AdminStatCards } from "@/components/admin/AdminStatCards";
import { PendingApplications } from "@/components/admin/PendingApplications";
import { UsersList } from "@/components/admin/UsersList";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  
  useEffect(() => {
    // Check if user is authenticated as admin
    const userType = localStorage.getItem("userType");
    const isAuthenticated = localStorage.getItem("isAuthenticated") === "true";
    
    if (!isAuthenticated || userType !== "admin") {
      toast.error("You must be logged in as an admin to view this page");
      navigate("/login");
    } else {
      setIsAdmin(true);
    }
  }, [navigate]);

  if (!isAdmin) {
    return <div className="p-8 text-center">Checking admin credentials...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <NavBar />
      
      <main className="flex-1 container max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold">Admin Dashboard</h1>
              <p className="text-muted-foreground">
                Manage applications, users, and system settings
              </p>
            </div>
          </div>
          
          <AdminStatCards />

          <Tabs defaultValue="applications" className="w-full">
            <TabsList className="grid grid-cols-3 md:w-[400px] mb-4">
              <TabsTrigger value="applications" className="flex items-center gap-2">
                <ClipboardList className="h-4 w-4" />
                <span className="hidden sm:inline">Applications</span>
              </TabsTrigger>
              <TabsTrigger value="doctors" className="flex items-center gap-2">
                <UserCog className="h-4 w-4" />
                <span className="hidden sm:inline">Doctors</span>
              </TabsTrigger>
              <TabsTrigger value="patients" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">Patients</span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="applications">
              <Card>
                <CardHeader>
                  <CardTitle>Pending Doctor Applications</CardTitle>
                  <CardDescription>
                    Review and manage applications from healthcare providers
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <PendingApplications />
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="doctors">
              <Card>
                <CardHeader>
                  <CardTitle>Registered Doctors</CardTitle>
                  <CardDescription>
                    View and manage all registered healthcare providers
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <UsersList userType="doctor" />
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="patients">
              <Card>
                <CardHeader>
                  <CardTitle>Registered Patients</CardTitle>
                  <CardDescription>
                    View and manage all registered patients
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <UsersList userType="patient" />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
