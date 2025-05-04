
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar, 
  Clock, 
  MoreVertical,
  Video,
  MessageSquare,
  CheckCircle,
  XCircle
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import api from "@/services/api";
import { 
  AnimatedSection, 
  AnimatedList, 
  AnimatedListItem 
} from "@/components/ui/dashboard-animations";
import { motion, AnimatePresence } from "framer-motion";

type AppointmentStatus = "scheduled" | "completed" | "cancelled" | "pending";

interface Appointment { // Keep this interface definition
  id: string;
  date: string;
  time: string;
  patientName?: string;
  doctorName?: string;
  reason: string;
  status: AppointmentStatus;
  type: "in-person" | "virtual";
}

interface AppointmentsListProps {
  userType: "doctor" | "patient";
  appointments: Appointment[]; // Add appointments prop here
}

export function AppointmentsList({ userType, appointments = [] }: AppointmentsListProps) {
  // Use the appointments passed from props directly, with a default empty array
  const [localAppointments, setLocalAppointments] = useState<Appointment[]>(appointments);
  const [isVisible, setIsVisible] = useState(true);
  
  // Update local state when props change
  useEffect(() => {
    setLocalAppointments(appointments);
  }, [appointments]);

  // Don't filter by hardcoded name, use all appointments passed from parent
  const filteredAppointments = localAppointments

  // Function to get status badge
  const getStatusBadge = (status: AppointmentStatus) => {
    switch (status) {
      case "scheduled":
        return <Badge className="bg-green-500">Scheduled</Badge>;
      case "completed":
        return <Badge className="bg-blue-500">Completed</Badge>;
      case "cancelled":
        return <Badge className="bg-red-500">Canceled</Badge>;
      case "pending":
        return <Badge className="bg-yellow-500">Pending</Badge>;
      default:
        return null;
    }
  };

  // Function to handle appointment status change
  const handleStatusChange = async (appointmentId: string, newStatus: AppointmentStatus) => {
    try {
      
      const updatedAppointmentData = await api.updateAppointmentStatus(appointmentId, newStatus);
  
      // Update local state - this remains the same
      setLocalAppointments(prevAppointments =>
        prevAppointments.map(apt =>
          apt.id === appointmentId ? { ...apt, status: newStatus } : apt
        )
      );
  
      toast.success(`Appointment status updated to ${newStatus}`);
  
    } catch (error: any) {
      // The error thrown by api.updateAppointmentStatus might already have a good message
      console.error('Error updating appointment status:', error);
      // Use the error message thrown by the API function, or a default
      toast.error(error.message || "Failed to update appointment status");
    }
  };
  

  return (
    <AnimatedSection className="space-y-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="rounded-md border shadow-sm overflow-hidden bg-white dark:bg-gray-800"
      >
        <div className="p-4 border-b bg-gray-50 dark:bg-gray-900">
          <h3 className="text-lg font-medium">Upcoming Appointments</h3>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 dark:bg-gray-900">
                <TableHead className="font-medium">Date & Time</TableHead>
                {userType === "doctor" && <TableHead className="font-medium">Patient</TableHead>}
                {userType === "patient" && <TableHead className="font-medium">Doctor</TableHead>}
                <TableHead className="font-medium">Reason</TableHead>
                <TableHead className="font-medium">Type</TableHead>
                <TableHead className="font-medium">Status</TableHead>
                <TableHead className="text-right font-medium">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <AnimatePresence>
                {filteredAppointments.length > 0 ? (
                  filteredAppointments.map((appointment, index) => (
                    <motion.tr
                      key={appointment.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ 
                        opacity: isVisible ? 1 : 0, 
                        y: isVisible ? 0 : 20 
                      }}
                      transition={{ delay: index * 0.05 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="border-b hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      whileHover={{ backgroundColor: "rgba(0,0,0,0.02)" }}
                    >
                      <TableCell>
                        <motion.div 
                          className="flex flex-col"
                          initial={{ x: -5, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: index * 0.05 + 0.1 }}
                        >
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3 text-muted-foreground" />
                            <span>{new Date(appointment.date).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span>{appointment.time}</span>
                          </div>
                        </motion.div>
                      </TableCell>
                      {userType === "doctor" && (
                        <TableCell>
                          <motion.div
                            initial={{ x: -5, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: index * 0.05 + 0.15 }}
                            className="font-medium"
                          >
                            {appointment.patientName}
                          </motion.div>
                        </TableCell>
                      )}
                      {userType === "patient" && (
                        <TableCell>
                          <motion.div
                            initial={{ x: -5, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: index * 0.05 + 0.15 }}
                            className="font-medium"
                          >
                            {appointment.doctorName}
                          </motion.div>
                        </TableCell>
                      )}
                      <TableCell>
                        <motion.div
                          initial={{ x: -5, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: index * 0.05 + 0.2 }}
                        >
                          {appointment.reason}
                        </motion.div>
                      </TableCell>
                      <TableCell>
                        <motion.div
                          initial={{ x: -5, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: index * 0.05 + 0.25 }}
                          whileHover={{ scale: 1.05 }}
                        >
                          {appointment.type === "virtual" ? (
                            <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-200">
                              <Video className="h-3 w-3 mr-1" />
                              Virtual
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">
                              In-person
                            </Badge>
                          )}
                        </motion.div>
                      </TableCell>
                      <TableCell>
                        <motion.div
                          initial={{ x: -5, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: index * 0.05 + 0.3 }}
                        >
                          {getStatusBadge(appointment.status)}
                        </motion.div>
                      </TableCell>
                      <TableCell className="text-right">
                        <motion.div
                          initial={{ x: -5, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: index * 0.05 + 0.35 }}
                        >
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-[200px] p-2">
                              {appointment.type === "virtual" && appointment.status === "scheduled" && (
                                <DropdownMenuItem className="cursor-pointer flex items-center gap-2 text-blue-600 dark:text-blue-400">
                                  <Video className="h-4 w-4 mr-2" />
                                  Join Video Call
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem className="cursor-pointer flex items-center gap-2 text-gray-600 dark:text-gray-300">
                                <MessageSquare className="h-4 w-4 mr-2" />
                                Send Message
                              </DropdownMenuItem>
                              {userType === "doctor" && (
                                <>
                                  {appointment.status === "pending" && (
                                    <>
                                      <DropdownMenuItem 
                                        onClick={() => handleStatusChange(appointment.id, "scheduled")}
                                        className="cursor-pointer flex items-center gap-2 text-green-600 dark:text-green-400"
                                      >
                                        <CheckCircle className="h-4 w-4" />
                                        Confirm Appointment
                                      </DropdownMenuItem>
                                      <DropdownMenuItem 
                                        onClick={() => handleStatusChange(appointment.id, "cancelled")}
                                        className="cursor-pointer flex items-center gap-2 text-red-600 dark:text-red-400"
                                      >
                                        <XCircle className="h-4 w-4" />
                                        Cancel Appointment
                                      </DropdownMenuItem>
                                    </>
                                  )}
                                  {appointment.status === "scheduled" && (
                                    <>
                                      <DropdownMenuItem 
                                        onClick={() => handleStatusChange(appointment.id, "completed")}
                                        className="cursor-pointer flex items-center gap-2 text-green-600 dark:text-green-400"
                                      >
                                        <CheckCircle className="h-4 w-4" />
                                        Mark as Completed
                                      </DropdownMenuItem>
                                      <DropdownMenuItem 
                                        onClick={() => handleStatusChange(appointment.id, "cancelled")}
                                        className="cursor-pointer flex items-center gap-2 text-red-600 dark:text-red-400"
                                      >
                                        <XCircle className="h-4 w-4" />
                                        Cancel Appointment
                                      </DropdownMenuItem>
                                    </>
                                  )}
                                  {(appointment.status === "completed" || appointment.status === "cancelled") && (
                                    <DropdownMenuItem disabled className="text-gray-400">
                                      No actions available
                                    </DropdownMenuItem>
                                  )}
                                </>
                              )}
                              {userType === "patient" && (appointment.status === "pending" || appointment.status === "scheduled") && (
                                <DropdownMenuItem 
                                  onClick={() => handleStatusChange(appointment.id, "cancelled")}
                                  className="cursor-pointer flex items-center gap-2 text-red-600 dark:text-red-400"
                                >
                                  <XCircle className="h-4 w-4" />
                                  Cancel Appointment
                                </DropdownMenuItem>
                              )}
                              {userType === "patient" && appointment.status === "cancelled" && (
                                <DropdownMenuItem className="cursor-pointer flex items-center gap-2 text-blue-600 dark:text-blue-400">
                                  <Calendar className="h-4 w-4" />
                                  Reschedule
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </motion.div>
                      </TableCell>
                    </motion.tr>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={userType === 'doctor' ? 7 : 6} className="h-24 text-center">
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5 }}
                      >
                        No appointments found.
                      </motion.div>
                    </TableCell>
                  </TableRow>
                )}
              </AnimatePresence>
            </TableBody>
          </Table>
        </div>
      </motion.div>
    </AnimatedSection>
  );
}
