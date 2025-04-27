
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Clock, Users, FileText, MessageCircle, AlertCircle } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  description: string;
  icon: React.ReactNode;
  color: string;
}

function StatCard({ title, value, description, icon, color }: StatCardProps) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className={`p-4 ${color} text-white`}>
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-medium">{title}</CardTitle>
          {icon}
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <p className="text-3xl font-bold">{value}</p>
        <CardDescription className="text-xs mt-1">{description}</CardDescription>
      </CardContent>
    </Card>
  );
}

interface DashboardStatsProps {
  userType: "doctor" | "patient";
}

export function DashboardStats({ userType }: DashboardStatsProps) {
  const [stats, setStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        if (userType === "doctor") {
          const token = localStorage.getItem("token");
          // Fetch appointments for today
          const appointments = await api.get("/appointments", token!);
          const today = new Date().toISOString().split("T")[0];
          const appointmentsToday = appointments.filter((apt: any) => {
            if (!apt.date) return false;
            const dt = new Date(apt.date);
            return dt.toISOString().split("T")[0] === today;
          });
          // Fetch patients
          let patients = [];
          try {
            patients = await api.getDoctorPatients();
          } catch {}
          // Unread messages (dummy, replace with real API if available)
          let unreadMessages = 0;
          try {
            const messages = await api.get("/messages/unread", token!);
            unreadMessages = Array.isArray(messages) ? messages.length : 0;
          } catch {}
          setStats([
            {
              title: "Appointments Today",
              value: appointmentsToday.length,
              description: `${appointmentsToday.length} scheduled today`,
              icon: <Calendar className="h-5 w-5" />, color: "bg-hospital-blue"
            },
            {
              title: "Total Patients",
              value: patients.length,
              description: `${patients.length} unique patients`,
              icon: <Users className="h-5 w-5" />, color: "bg-hospital-green"
            },
            {
              title: "Unread Messages",
              value: unreadMessages,
              description: `${unreadMessages} unread`,
              icon: <MessageCircle className="h-5 w-5" />, color: "bg-purple-500"
            }
          ]);
        } else {
          // Patient stats: fetch real data from API
          const token = localStorage.getItem("token");
          let appointments = [];
          let prescriptions = [];
          let unreadMessages = 0;
          try {
            appointments = await api.get("/appointments", token!);
          } catch {}
          try {
            prescriptions = await api.get("/prescription", token!);
          } catch {}
          
          try {
            const messages = await api.get("/messages/unread", token!);
            unreadMessages = Array.isArray(messages) ? messages.length : 0;
          } catch {}
          const upcomingAppointments = appointments.filter((apt: any) => apt.status === "pending" || apt.status === "scheduled");
          setStats([
            {
              title: "Upcoming Appointments",
              value: upcomingAppointments.length,
              description: upcomingAppointments.length > 0 ? `Next one on ${upcomingAppointments[0]?.date ? new Date(upcomingAppointments[0].date).toLocaleDateString() : ''}` : "No upcoming appointments",
              icon: <Calendar className="h-5 w-5" />, color: "bg-hospital-blue"
            },
            {
              title: "Prescriptions",
              value: prescriptions.length,
              description: prescriptions.length > 0 ? `Remember to take meds on time` : "No prescriptions",
              icon: <FileText className="h-5 w-5" />, color: "bg-hospital-green"
            },
            {
              title: "Unread Messages",
              value: unreadMessages,
              description: unreadMessages > 0 ? `You have ${unreadMessages} unread` : "No unread messages",
              icon: <MessageCircle className="h-5 w-5" />, color: "bg-purple-500"
            }
          ]);
        }
      } catch (error) {
        setStats([]);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [userType]);

  if (loading) {
    return <div className="py-8 text-center">Loading stats...</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <StatCard key={index} {...stat} />
      ))}
    </div>
  );
}
import { useEffect, useState } from "react";
import api from "@/services/api";
