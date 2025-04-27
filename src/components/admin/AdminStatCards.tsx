
import { useState, useEffect } from "react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Users, UserCog, ClipboardList, Calendar } from "lucide-react";
import api from "@/services/api";
import { toast } from "sonner";

export const AdminStatCards = () => {
  const [stats, setStats] = useState([
    {
      title: "Total Patients",
      value: "--",
      icon: Users,
      description: "Active registered patients",
      change: "",
      changeType: "positive" as const
    },
    {
      title: "Registered Doctors",
      value: "--",
      icon: UserCog,
      description: "Approved healthcare providers",
      change: "",
      changeType: "positive" as const
    },
    {
      title: "Pending Applications",
      value: "--",
      icon: ClipboardList,
      description: "Awaiting review",
      change: "",
      changeType: "neutral" as const
    },
    {
      title: "Appointments Today",
      value: "--",
      icon: Calendar,
      description: "Scheduled for today",
      change: "",
      changeType: "neutral" as const
    }
  ]);
  
  useEffect(() => {
    const fetchAdminStats = async () => {
      try {
        const adminStats = await api.getAdminStats();
        
        setStats([
          {
            title: "Total Patients",
            value: adminStats.totalPatients.toString(),
            icon: Users,
            description: "Active registered patients",
            change: "",
            changeType: "positive" as const
          },
          {
            title: "Registered Doctors",
            value: adminStats.activeDoctorCount.toString(),
            icon: UserCog,
            description: "Approved healthcare providers",
            change: "",
            changeType: "positive" as const
          },
          {
            title: "Pending Doctor Applications",
            value: adminStats.pendingDoctorCount.toString(),
            icon: ClipboardList,
            description: "Awaiting review",
            change: "",
            changeType: "neutral" as const
          },
          {
            title: "Appointments Today",
            value: adminStats.appointmentsToday.toString(),
            icon: Calendar,
            description: "Scheduled for today",
            change: "",
            changeType: "neutral" as const
          }
        ]);
      } catch (error: any) {
        toast.error("Failed to load admin statistics");
        console.error("Error loading admin stats:", error);
      }
    };
    
    fetchAdminStats();
  }, []);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {stat.title}
            </CardTitle>
            <stat.icon className="h-4 w-4 text-hospital-blue" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            <p className="text-xs text-muted-foreground">{stat.description}</p>
            <div className={`mt-1 text-xs ${stat.changeType === "positive" ? "text-green-500" : "text-red-500"}`}>
              {stat.change} from last month
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
