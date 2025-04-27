
import { NavBar } from "@/components/layout/NavBar";
import { DashboardStats } from "@/components/dashboard/DashboardStats";
import { AppointmentsList } from "@/components/dashboard/AppointmentsList";
import { Button } from "@/components/ui/button";
import { CalendarPlus, Clock, FileText, Star, MessageSquare } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { AppointmentBooking } from "@/components/dashboard/AppointmentBooking";
import { toast } from "sonner";
import api from "@/services/api";


const PatientDashboard = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const userId = id || localStorage.getItem('userId');
  
  // State for user data and appointments
  const [appointments, setAppointments] = useState([]);
  const [isAppointmentDialogOpen, setIsAppointmentDialogOpen] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Handle new appointment booking
  const handleNewAppointment = async (appointmentData: any) => {
    try {
      // In a real implementation, this would call the API to create an appointment
      // For now, we'll just update the local state
      setAppointments((prevAppointments: any) => [...prevAppointments, appointmentData]);
      setIsAppointmentDialogOpen(false);
      toast.success("Appointment booked successfully");
    } catch (error) {
      toast.error("Failed to book appointment");
    }
  };

  // Fetch user data and appointments
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        // Check authentication
        const token = localStorage.getItem('token');
        const userType = localStorage.getItem('userType');
        
        if (!token || userType !== 'patient') {
          navigate('/login');
          return;
        }
        
        // Fetch user profile data
        const response = await api.get('/profile', token);
        setUserData(response);
        
        // Fetch appointments
        const appointmentsResponse = await api.get('/appointments', token);
        setAppointments(appointmentsResponse);
      } catch (error) {
        console.error('Error fetching user data:', error);
        toast.error('Failed to load your dashboard data');
        
        setAppointments([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserData();
  }, [navigate, userId]);
  
  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-hospital-blue mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      <div className="container px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-1">Welcome, {userData?.user?.firstName || 'Patient'}</h1>
          <p className="text-muted-foreground">
            Here's an overview of your health information
          </p>
        </div>
        
        <div className="mb-8">
          <DashboardStats userType="patient" />
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card className="lg:col-span-2">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Upcoming Appointments</CardTitle>
                  <CardDescription>Your scheduled appointments</CardDescription>
                </div>
                <Dialog open={isAppointmentDialogOpen} onOpenChange={setIsAppointmentDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-hospital-blue hover:bg-blue-700">
                      <CalendarPlus className="mr-2 h-4 w-4" />
                      New Appointment
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl">
                    <AppointmentBooking 
                      onClose={() => setIsAppointmentDialogOpen(false)}
                      onAppointmentBooked={handleNewAppointment}
                    />
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {appointments.filter(apt => apt.status === 'pending' || apt.status === 'scheduled').length > 0 ? (
                <AppointmentsList userType="patient" appointments={appointments.filter(apt => apt.status === 'pending' || apt.status === 'scheduled')} />
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">No appointments scheduled yet.</p>
                  <p className="text-sm text-gray-400 mt-2">Book your appointment using the button above.</p>
                </div>
              )}
            </CardContent>
          </Card>
          
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => navigate("/messages")}
                >
                   <MessageSquare className="mr-2 h-4 w-4" /> 
                  Message
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => navigate("/patient-ratings")}
                >
                  <Star className="mr-2 h-4 w-4" />
                  Rate Your Doctors
                </Button>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Health Reminders</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-blue-700 text-sm">Stay happy and breathe oxygen! 😊</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientDashboard;
