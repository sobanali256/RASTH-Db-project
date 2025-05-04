import { NavBar } from "@/components/layout/NavBar";
import { AppointmentsList } from "@/components/dashboard/AppointmentsList";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Clock, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { DoctorCalendar } from "@/components/dashboard/DoctorCalendar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import api from "@/services/api";
import { toast } from "sonner";

type AppointmentStatus = "confirmed" | "completed" | "canceled" | "pending";

interface Appointment {
  id: string;
  date: string;
  time: string;
  patientName: string;
  reason: string;
  status: AppointmentStatus;
  type: "in-person" | "virtual";
}

const DoctorAppointments = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const userId = id || localStorage.getItem('userId');
  
  const [searchTerm, setSearchTerm] = useState("");
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState("all");
  
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };
  
  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const userType = localStorage.getItem('userType');
      
      if (!token || userType !== 'doctor') {
        navigate('/login');
        return;
      }
      
      const appointmentsResponse = await api.get('/appointments', token);

      console.log('Appointments response:', appointmentsResponse); // Log the response to the termina
      
      const formattedAppointments = appointmentsResponse.map((apt: any) => {
        let date = "";
        let time = "";
        if (apt.date) {
          const dt = new Date(apt.date);
          date = dt.toISOString().split('T')[0];
          // Format time as HH:MM AM/PM
          let hours = dt.getHours();
          const minutes = dt.getMinutes();
          const ampm = hours >= 12 ? 'PM' : 'AM';
          hours = hours % 12;
          hours = hours ? hours : 12; // the hour '0' should be '12'
          const minutesStr = minutes < 10 ? '0' + minutes : minutes;
          time = `${hours}:${minutesStr} ${ampm}`;
        } else {
          date = apt.date || new Date().toISOString().split('T')[0];
          time = apt.date || '09:00 AM';
        }
        return {
          id: apt.id || `apt-${Math.random().toString(36).substr(2, 9)}`,
          date,
          time,
          patientName: apt.patientFirstName && apt.patientLastName ? 
            `${apt.patientFirstName} ${apt.patientLastName}` : 
            (apt.patientName || 'No patient name'),
          reason: apt.reason || 'Consultation',
          status: apt.status || 'pending',
          type: apt.type || 'in-person'
        };
      });
      
      setAppointments(formattedAppointments);
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
    
    if (!isAuthenticated || userType !== "doctor") {
      navigate("/login");
      return;
    }
    
    fetchAppointments();
  }, [navigate, userId]);
  
  // Filter appointments based on tab and search
  const filteredAppointments = appointments.filter((apt) => {
    // Filter by tab
    let tabMatch = true;
    if (tabValue === "pending") tabMatch = apt.status === "pending";
    else if (tabValue === "completed") tabMatch = apt.status === "completed";
    else if (tabValue === "upcoming") {
      const aptDate = new Date(apt.date);
      const now = new Date();
      tabMatch = apt.status === "scheduled" && aptDate >= now;
    }
    // Filter by search
    const search = searchTerm.trim().toLowerCase();
    let searchMatch = true;
    if (search) {
      searchMatch = (apt.patientName?.toLowerCase().includes(search) || apt.reason?.toLowerCase().includes(search));
    }
    return tabMatch && searchMatch;
  });
  
  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      <div className="container px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-1">Appointments</h1>
          <p className="text-muted-foreground">
            Manage your patient appointments
          </p>
        </div>
        
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-2 top-3 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search appointments by patient name or reason..." 
              className="pl-8"
              value={searchTerm}
              onChange={handleSearch}
            />
          </div>
        </div>
        
        <Card>
          <CardHeader>
            <div className="flex items-center">
              <div className="mr-4">
                <CardTitle>Appointment Schedule</CardTitle>
                <CardDescription>View and manage upcoming appointments</CardDescription>
              </div>
              <div className="ml-auto flex items-center text-sm text-muted-foreground">
                <Clock className="mr-1 h-4 w-4" />
                <span>Current time: {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="all" onValueChange={setTabValue}>
              <div className="flex justify-between items-center mb-6">
                <TabsList className="grid w-full max-w-md grid-cols-4">
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                  <TabsTrigger value="pending">Pending</TabsTrigger>
                  <TabsTrigger value="completed">Completed</TabsTrigger>
                </TabsList>
                
                <div className="flex gap-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline">
                        <Calendar className="mr-2 h-4 w-4" />
                        View Calendar
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl">
                      <DoctorCalendar 
                        doctorName={`Dr. ${localStorage.getItem('firstName') || ''} ${localStorage.getItem('lastName') || ''}`}
                        appointments={appointments}
                      />
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
              
              <TabsContent value="all" className="mt-0">
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-hospital-blue mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading your appointments...</p>
                  </div>
                ) : (
                  filteredAppointments.length > 0 ? (
                    <AppointmentsList userType="doctor" appointments={filteredAppointments} />
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-500">No appointments scheduled yet.</p>
                      <p className="text-sm text-gray-400 mt-2">Your appointments will appear here once patients book with you.</p>
                    </div>
                  )
                )}
              </TabsContent>
              <TabsContent value="upcoming" className="mt-0">
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-hospital-blue mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading your appointments...</p>
                  </div>
                ) : (
                  filteredAppointments.length > 0 ? (
                    <AppointmentsList userType="doctor" appointments={filteredAppointments} />
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-500">No upcoming appointments.</p>
                    </div>
                  )
                )}
              </TabsContent>
              <TabsContent value="pending" className="mt-0">
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-hospital-blue mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading your appointments...</p>
                  </div>
                ) : (
                  filteredAppointments.length > 0 ? (
                    <AppointmentsList userType="doctor" appointments={filteredAppointments} />
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-500">No pending appointments.</p>
                    </div>
                  )
                )}
              </TabsContent>
              <TabsContent value="completed" className="mt-0">
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-hospital-blue mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading your appointments...</p>
                  </div>
                ) : (
                  filteredAppointments.length > 0 ? (
                    <AppointmentsList userType="doctor" appointments={filteredAppointments} />
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

export default DoctorAppointments;