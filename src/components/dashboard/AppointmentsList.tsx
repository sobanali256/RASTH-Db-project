
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
  MessageSquare
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
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date & Time</TableHead>
            {userType === "doctor" && <TableHead>Patient</TableHead>}
            {userType === "patient" && <TableHead>Doctor</TableHead>}
            <TableHead>Reason</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredAppointments.length > 0 ? (
            filteredAppointments.map((appointment) => (
              <TableRow key={appointment.id}>
                <TableCell>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3 text-muted-foreground" />
                      <span>{new Date(appointment.date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>{appointment.time}</span>
                    </div>
                  </div>
                </TableCell>
                {userType === "doctor" && (
                  <TableCell className="font-medium">{appointment.patientName}</TableCell>
                )}
                {userType === "patient" && (
                  <TableCell className="font-medium">{appointment.doctorName}</TableCell>
                )}
                <TableCell>{appointment.reason}</TableCell>
                <TableCell>
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
                </TableCell>
                <TableCell>{getStatusBadge(appointment.status)}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {appointment.type === "virtual" && appointment.status === "scheduled" && (
                        <DropdownMenuItem>
                          <Video className="h-4 w-4 mr-2" />
                          Join Video Call
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem>
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Send Message
                      </DropdownMenuItem>
                      {userType === "doctor" && (
                        <>
                          {appointment.status === "pending" && (
                            <>
                              <DropdownMenuItem onClick={() => handleStatusChange(appointment.id, "scheduled")}>Confirm Appointment</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleStatusChange(appointment.id, "cancelled")}>Cancel Appointment</DropdownMenuItem>
                            </>
                          )}
                          {appointment.status === "scheduled" && (
                            <>
                              <DropdownMenuItem onClick={() => handleStatusChange(appointment.id, "completed")}>Mark as Completed</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleStatusChange(appointment.id, "cancelled")}>Cancel Appointment</DropdownMenuItem>
                            </>
                          )}
                          {(appointment.status === "completed" || appointment.status === "cancelled") && (
                            <DropdownMenuItem disabled>No actions available</DropdownMenuItem>
                          )}
                        </>
                      )}
                      {userType === "patient" && (appointment.status === "pending" || appointment.status === "scheduled") && (
                        <DropdownMenuItem onClick={() => handleStatusChange(appointment.id, "cancelled")}>Cancel Appointment</DropdownMenuItem>
                      )}
                      {userType === "patient" && appointment.status === "cancelled" && (
                        <DropdownMenuItem>
                          Reschedule
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={userType === 'doctor' ? 7 : 6} className="h-24 text-center">
                No appointments found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
