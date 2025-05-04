
import { NavBar } from "@/components/layout/NavBar";
import { AppointmentsList } from "@/components/dashboard/AppointmentsList";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarPlus } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { AppointmentBooking } from "@/components/dashboard/AppointmentBooking";
import { toast } from "sonner";
import api from "@/services/api";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const PatientAppointments = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const userId = id || localStorage.getItem('userId');
  
  const [appointments, setAppointments] = useState<any[]>([]);
  const [isAppointmentDialogOpen, setIsAppointmentDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState("all");
  
  // Handle new appointment booking
  const handleNewAppointment = async (appointmentData: any) => {
    try {
      // Get token for API call
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error("Authentication required");
        return;
      }
      
      // In a real implementation, this would call the API to create an appointment
      // For now, we'll just update the local state
      await api.post('/appointments', appointmentData, token);
      
      // Refresh appointments after booking
      fetchAppointments();
      setIsAppointmentDialogOpen(false);
      toast.success("Appointment booked successfully");
    } catch (error) {
      console.error('Error booking appointment:', error);
      toast.error("Failed to book appointment");
    }
  };

  // Fetch appointments from the API
  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const userType = localStorage.getItem('userType');
      
      if (!token || userType !== 'patient') {
        navigate('/login');
        return;
      }
      
      // Fetch appointments from API
      const appointmentsResponse = await api.get('/appointments', token);
      console.log('Appointments response:', appointmentsResponse);
      setAppointments(appointmentsResponse);
    } catch (error) {
      console.error('Error fetching appointments:', error);
      toast.error('Failed to load appointments');
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Check if user is authenticated and the right type
    const isAuthenticated = localStorage.getItem("isAuthenticated") === "true";
    const userType = localStorage.getItem("userType");
    
    if (!isAuthenticated || userType !== "patient") {
      navigate("/login");
      return;
    }
    
    fetchAppointments();
  }, [navigate, userId]);
  
  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      <div className="container px-4 py-8">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold mb-1">My Appointments</h1>
            <p className="text-muted-foreground">
              Schedule and manage your appointments
            </p>
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
        
        <Card>
          <CardHeader>
            <CardTitle>Appointments</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="all" onValueChange={setTabValue}>
              <div className="mb-6">
                <TabsList className="grid w-full max-w-md grid-cols-4">
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                  <TabsTrigger value="pending">Pending</TabsTrigger>
                  <TabsTrigger value="completed">Completed</TabsTrigger>
                </TabsList>
              </div>
              <TabsContent value="all">
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-hospital-blue mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading your appointments...</p>
                  </div>
                ) : (
                  appointments.length > 0 ? (
                    <AppointmentsList userType="patient" appointments={appointments} />
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-500">No appointments scheduled yet.</p>
                      <p className="text-sm text-gray-400 mt-2">Book your first appointment using the button above.</p>
                    </div>
                  )
                )}
              </TabsContent>
              <TabsContent value="upcoming">
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-hospital-blue mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading your appointments...</p>
                  </div>
                ) : (
                  appointments.filter(apt => apt.status === "scheduled" && new Date(apt.date) >= new Date()).length > 0 ? (
                    <AppointmentsList userType="patient" appointments={appointments.filter(apt => apt.status === "scheduled" && new Date(apt.date) >= new Date())} />
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-500">No upcoming appointments.</p>
                    </div>
                  )
                )}
              </TabsContent>
              <TabsContent value="pending">
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-hospital-blue mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading your appointments...</p>
                  </div>
                ) : (
                  appointments.filter(apt => apt.status === "pending").length > 0 ? (
                    <AppointmentsList userType="patient" appointments={appointments.filter(apt => apt.status === "pending")}/>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-500">No pending appointments.</p>
                    </div>
                  )
                )}
              </TabsContent>
              <TabsContent value="completed">
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-hospital-blue mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading your appointments...</p>
                  </div>
                ) : (
                  appointments.filter(apt => apt.status === "completed").length > 0 ? (
                    <AppointmentsList userType="patient" appointments={appointments.filter(apt => apt.status === "completed")}/>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-500">No completed appointments.</p>
                    </div>
                  )
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PatientAppointments;
