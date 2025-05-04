import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Clock, Users, FileText, MessageCircle, AlertCircle, MessageSquare, LucideAlignVerticalDistributeStart } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/services/api";
import { 
  AnimatedSection, 
  AnimatedList, 
  gradientBackgrounds 
} from "@/components/ui/dashboard-animations";
import { motion } from "framer-motion";

interface StatCardProps {
  title: string;
  value: string | number;
  description: string;
  icon: React.ReactNode;
  color: string;
  onClick?: () => void;
}

function StatCard({ title, value, description, icon, color, onClick }: StatCardProps) {
  return (
    <Card 
      className={`overflow-hidden hover:shadow-md transition-shadow duration-300 ${onClick ? 'cursor-pointer' : ''}`} 
      onClick={onClick}
    >
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
  const [latestPost, setLatestPost] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          console.error("No authentication token found");
          setStats([]);
          setLoading(false);
          return;
        }

        let latestCommunityPost = null;
        
        // Fetch community posts for patient dashboard
        if (userType === "patient") {
          try {
            const communityPosts = await api.get("/community/posts", token);
            if (communityPosts && communityPosts.length > 0) {
              const sortedPosts = [...communityPosts].sort((a, b) => 
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
              );
              latestCommunityPost = sortedPosts[0]; // Store in local variable first
              setLatestPost(latestCommunityPost); // Then update state
            }
          } catch (error) {
            console.error("Error fetching community posts:", error);
          }
        }

        if (userType === "doctor") {
          // Fetch appointments for today
          let appointments = [];
          try {
            appointments = await api.get("/appointments", token);
          } catch (error) {
            console.error("Error fetching appointments:", error);
            appointments = [];
          }

          const today = new Date().toISOString().split("T")[0];
          const appointmentsToday = appointments.filter((apt: any) => {
            if (!apt || !apt.date) return false;
            const dt = new Date(apt.date);
            return dt.toISOString().split("T")[0] === today;
          });

          // Fetch patients
          let patients = [];
          try {
            patients = await api.getDoctorPatients();
          } catch (error) {
            console.error("Error fetching patients:", error);
            patients = [];
          }

          // Unread messages
          let unreadMessages = 0;
          try {
            const messages = await api.get("/unreadMessages", token);
            unreadMessages = Array.isArray(messages) ? messages.length : 0;
          } catch (error) {
            console.error("Error fetching unread messages:", error);
          }

          const doctorStats = [
            {
              title: "Appointments Today",
              value: appointmentsToday.length,
              description: `${appointmentsToday.length} scheduled today`,
              icon: <Calendar className="h-5 w-5" />, 
              color: "bg-hospital-blue",
              onClick: () => navigate('/doctor-appointments')
            },
            {
              title: "Total Patients",
              value: patients.length,
              description: `${patients.length} unique patients`,
              icon: <Users className="h-5 w-5" />, 
              color: "bg-hospital-green",
              onClick: () => navigate('/doctor-patients')
            },
            {
              title: "Unread Messages",
              value: unreadMessages,
              description: `${unreadMessages} unread`,
              icon: <MessageCircle className="h-5 w-5" />, 
              color: "bg-purple-500",
              onClick: () => navigate('/messages')
            }
          ];
          
          setStats(doctorStats);
        } else {
          // Patient stats
          let appointments = [];
          let prescriptions = [];
          let unreadMessages = 0;
          
          try {
            appointments = await api.get("/appointments", token);
          } catch (error) {
            console.error("Error fetching appointments:", error);
            appointments = [];
          }
          
          try {
            prescriptions = await api.get("/prescription", token);
          } catch (error) {
            console.error("Error fetching prescriptions:", error);
            prescriptions = [];
          }
          
          try {
            const messages = await api.get("/unreadMessages", token);
            unreadMessages = Array.isArray(messages) ? messages.length : 0;
          } catch (error) {
            console.error("Error fetching unread messages:", error);
          }
          
          const upcomingAppointments = appointments.filter((apt: any) => 
            apt && (apt.status === "pending" || apt.status === "scheduled")
          );
          
          const patientStats = [
            {
              title: "Upcoming Appointments",
              value: upcomingAppointments.length,
              description: upcomingAppointments.length > 0 && upcomingAppointments[0]?.date 
                ? `Next one on ${new Date(upcomingAppointments[0].date).toLocaleDateString()}` 
                : "No upcoming appointments",
              icon: <Calendar className="h-5 w-5" />, 
              color: "bg-hospital-blue",
              onClick: () => navigate('/patient-appointments')
            },
            {
              title: "Prescriptions",
              value: prescriptions.length,
              description: prescriptions.length > 0 
                ? `Remember to take meds on time` 
                : "No prescriptions",
              icon: <FileText className="h-5 w-5" />, 
              color: "bg-hospital-green",
              onClick: () => navigate('/patient-records')
            },
            {
              title: "Unread Messages",
              value: unreadMessages,
              description: unreadMessages > 0 
                ? `You have ${unreadMessages} unread` 
                : "No unread messages",
              icon: <MessageCircle className="h-5 w-5" />, 
              color: "bg-purple-500",
              onClick: () => navigate('/messages')
            }
          ];
          
          setStats(patientStats);
        }
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
        setStats([]);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [userType, navigate]); // Removed latestPost from dependencies to prevent infinite loop

  if (loading) {
    return <div className="py-8 text-center">Loading stats...</div>;
  }

  return (
    <AnimatedSection className="space-y-6">
      <motion.h2 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-2xl font-bold mb-4"
      >
        {userType === "doctor" ? "Doctor Dashboard" : "Patient Dashboard"}
      </motion.h2>
      
      <AnimatedList className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {loading ? (
          // Loading skeleton with improved animation
          Array.from({ length: 4 }).map((_, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className="overflow-hidden border-0 shadow-sm">
                <div className="h-24 bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
                <CardContent className="p-4 space-y-3">
                  <div className="h-4 w-2/3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                  <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        ) : (
          // Actual stats cards with enhanced animation matching the community card
          <>
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 20 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.02, boxShadow: "0 10px 15px rgba(0,0,0,0.1)" }}
                className="cursor-pointer"
                onClick={stat.onClick}
              >
                <Card className="overflow-hidden border-0 shadow-sm h-full">
                  <CardHeader className={`p-4 ${stat.color} text-white`}>
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-lg font-medium">{stat.title}</CardTitle>
                      <motion.div
                        animate={{ rotate: [0, 10, 0] }}
                        transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
                      >
                        {stat.icon}
                      </motion.div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 bg-white dark:bg-gray-800">
                    <p className="text-3xl font-bold">{stat.value}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{stat.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
            
            {/* Community post card for patients with enhanced animation */}
            {userType === "patient" && latestPost && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 20 }}
                transition={{ delay: stats.length * 0.1 }}
                whileHover={{ scale: 1.02, boxShadow: "0 10px 15px rgba(0,0,0,0.1)" }}
                className="cursor-pointer"
                onClick={() => navigate("/patient-community")}
              >
                <Card className="overflow-hidden border-0 shadow-sm h-full">
                  <CardHeader className={`p-4 ${gradientBackgrounds.purple} text-white`}>
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-lg font-medium">Community</CardTitle>
                      <motion.div
                        animate={{ rotate: [0, 10, 0] }}
                        transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
                      >
                        <MessageSquare className="h-5 w-5" />
                      </motion.div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 bg-white dark:bg-gray-800">
                    <p className="font-semibold truncate">{latestPost.title}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{latestPost.content}</p>
                    <div className="mt-2 flex justify-between items-center">
                      <span className="text-xs text-gray-500 dark:text-gray-400">{new Date(latestPost.createdAt).toLocaleDateString()}</span>
                      <motion.span 
                        whileHover={{ scale: 1.1 }}
                        className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100 rounded-full px-2 py-1"
                      >
                        {latestPost.flair}
                      </motion.span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </>
        )}
      </AnimatedList>
    </AnimatedSection>
  );
}