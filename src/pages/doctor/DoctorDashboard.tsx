import { NavBar } from "@/components/layout/NavBar";
import { DashboardStats } from "@/components/dashboard/DashboardStats";
import { AppointmentsList } from "@/components/dashboard/AppointmentsList";
import { Button } from "@/components/ui/button";
import { Search, Bell, Calendar, CheckCircle, Star, MessageSquare } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { DoctorCalendar } from "@/components/dashboard/DoctorCalendar";
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { DoctorRatings } from "@/components/dashboard/DoctorRatings"
import api from "@/services/api";

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

interface Rating {
  id: string;
  doctorId: string;
  patientName: string;
  rating: number;
  comment: string;
  date: Date;
}

const DoctorDashboard = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const userId = id || localStorage.getItem('userId');
  
  const [searchTerm, setSearchTerm] = useState("");
  const [showCalendar, setShowCalendar] = useState(false);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [ratingsLoading, setRatingsLoading] = useState(false);

  const calculateAverageRating = () => {
    if (ratings.length === 0) return 0;
    const sum = ratings.reduce((total, rating) => total + rating.rating, 0);
    return Math.round((sum / ratings.length) * 10) / 10;
  };
  const handleSearch = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    if (e.target.value.trim()) {
      setSearchLoading(true);
      try {
        const token = localStorage.getItem('token');
        const results = await api.getDoctorPatients();
        const filtered = results.filter((p: any) => p.name?.toLowerCase().includes(e.target.value.trim().toLowerCase()));
        setSearchResults(filtered);
      } catch (err) {
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    } else {
      setSearchResults([]);
    }
  };

  useEffect(() => {
    const fetchDoctorData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        const userType = localStorage.getItem('userType');
        if (!token || userType !== 'doctor') {
          navigate('/login');
          return;
        }
        const response = await api.get('/profile', token);
        setUserData(response);
        const appointmentsResponse = await api.get('/appointments', token);
        const formattedAppointments = appointmentsResponse.map((apt: any) => {
          let date = "";
          let time = "";
          if (apt.date) {
            const dt = new Date(apt.date);
            date = dt.toISOString().split('T')[0];
            let hours = dt.getHours();
            const minutes = dt.getMinutes();
            const ampm = hours >= 12 ? 'PM' : 'AM';
            hours = hours % 12;
            hours = hours ? hours : 12;
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
            patientName: apt.patientFirstName && apt.patientLastName ? `${apt.patientFirstName} ${apt.patientLastName}` : (apt.patientName || 'No patient name'),
            reason: apt.reason || 'Consultation',
            status: apt.status || 'pending',
            type: apt.type || 'in-person'
          };
        });
        setAppointments(formattedAppointments);
        // Notifications: pending, cancelled, or upcoming (next day)
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(now.getDate() + 1);
        const notif = formattedAppointments.filter(apt =>
          apt.status === 'pending' ||
          apt.status === 'canceled' ||
          (apt.status === 'confirmed' && new Date(apt.date).toISOString().split('T')[0] === tomorrow.toISOString().split('T')[0])
        );
        setNotifications(notif);
        // Fetch ratings/feedback
        setRatingsLoading(true);
        try {
          const ratingsRes = await api.get('/ratings', token);
          setRatings(ratingsRes);
        } catch {
          setRatings([]);
        } finally {
          setRatingsLoading(false);
        }
      } catch (error) {
        setUserData({ user: { firstName: 'John', lastName: 'Doe' } });
        setAppointments([]);
        setNotifications([]);
        setRatings([]);
      } finally {
        setLoading(false);
      }
    };
    fetchDoctorData();
  }, [navigate, userId]);
  const averageRating = calculateAverageRating();
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
          <h1 className="text-3xl font-bold mb-1">Welcome, Dr. {userData?.user?.lastName || 'Doctor'}</h1>
          <p className="text-muted-foreground">
            Here's your practice overview for today
          </p>
        </div>
        
        <div className="mb-8">
          <DashboardStats userType="doctor" />
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {!showCalendar ? (
            <Card className="lg:col-span-2">
              <CardHeader className="pb-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <CardTitle>Today's Appointments</CardTitle>
                    <CardDescription>Manage your schedule for today</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setShowCalendar(true)}>
                      <Calendar className="mr-2 h-4 w-4" />
                      View Calendar
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {appointments.length > 0 ? (
                  <AppointmentsList userType="doctor" appointments={appointments.filter(apt => apt.date === new Date().toISOString().split('T')[0])} />
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No appointments scheduled yet.</p>
                    <p className="text-sm text-gray-400 mt-2">Your appointments will appear here once patients book with you.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="lg:col-span-2">
              <CardHeader className="pb-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <CardTitle>Appointment Calendar</CardTitle>
                    <CardDescription>View and manage your schedule</CardDescription>
                  </div>
                  <Button variant="outline" onClick={() => setShowCalendar(false)}>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Back to Today
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <DoctorCalendar 
                  doctorName={`Dr. ${userData?.user?.firstName || ''} ${userData?.user?.lastName || ''}`}
                  appointments={appointments}
                />
              </CardContent>
            </Card>
          )}
          
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Patient Search</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative max-w-md mb-4">
                  <Search className="absolute left-2 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search patients..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={handleSearch}
                  />
                </div>
                {searchLoading ? (
                  <div className="text-center text-gray-500">Searching...</div>
                ) : searchTerm && (
                  <div>
                    {searchResults.length > 0 ? (
                      <ul className="divide-y">
                        {searchResults.map((patient: any) => (
                          <li key={patient.id} className="py-2">
                            <span className="font-medium">{patient.name}</span> — {patient.age} years, {patient.gender}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="text-center text-gray-500">No patients found.</div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Notifications</CardTitle>
              </CardHeader>
              <CardContent>
                {notifications.length > 0 ? (
                  <ul className="space-y-2">
                    {notifications.map((apt: any) => (
                      <li key={apt.id} className="p-2 border rounded bg-blue-50">
                        <span className="font-medium">{apt.patientName}</span> — {apt.status === 'pending' ? 'Pending appointment' : apt.status === 'canceled' ? 'Cancelled appointment' : 'Upcoming appointment (tomorrow)'} on {apt.date} at {apt.time}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-gray-500">No notifications.</div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>My Ratings & Feedback</CardTitle>
                <CardDescription>
                  View feedback from your patients
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-5 w-5 ${
                          star <= averageRating
                            ? "text-yellow-400 fill-yellow-400"
                            : "text-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-lg font-medium">{averageRating.toFixed(1)}</span>
                  <span className="text-sm text-muted-foreground">({ratings.length} reviews)</span>
                </div>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => navigate("/doctor-ratings")}
                >
                  <MessageSquare className="mr-2 h-4 w-4" />
                  View All Feedback
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorDashboard;


