
import { useEffect, useState } from "react";
import { format, addDays, startOfWeek, isSameDay } from "date-fns";
import { ChevronLeft, ChevronRight, Clock, Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import api from "@/services/api";
import { 
  AnimatedCard, 
  AnimatedSection, 
  AnimatedList, 
  AnimatedListItem,
  EnhancedBadge,
  fadeIn,
  slideUp
} from "@/components/ui/dashboard-animations";
import { motion } from "framer-motion";

interface Appointment {
  id: string;
  date: string;
  time: string;
  patientName: string;
  reason: string;
  status: string;
  type: "in-person" | "virtual";
}

interface DoctorCalendarProps {
  doctorName: string;
  appointments: Appointment[];
}

export function DoctorCalendar({ doctorName, appointments }: DoctorCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentWeek, setCurrentWeek] = useState<Date>(startOfWeek(new Date(), { weekStartsOn: 1 }));
  
  // Filter appointments for selected date
  const appointmentsForSelectedDate = appointments.filter(
    (appointment) => {
      const appointmentDate = new Date(appointment.date);
      return isSameDay(appointmentDate, selectedDate);
    }
  );
  
  // Function to get dates with appointments for calendar highlighting
  const datesWithAppointments = appointments.map(apt => new Date(apt.date));
  
  // Generate the week view
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(currentWeek, i));
  
  // Get appointments for a specific day
  const getAppointmentsForDay = (date: Date) => {
    return appointments.filter(appointment => {
      const appointmentDate = new Date(appointment.date);
      return isSameDay(appointmentDate, date);
    });
  };
  
  // Navigate to previous week
  const goToPreviousWeek = () => {
    setCurrentWeek(addDays(currentWeek, -7));
  };
  
  // Navigate to next week
  const goToNextWeek = () => {
    setCurrentWeek(addDays(currentWeek, 7));
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Appointment Calendar</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={goToPreviousWeek}>
            <ChevronLeft className="h-4 w-4" />
            Previous Week
          </Button>
          <Button variant="outline" onClick={goToNextWeek}>
            Next Week
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-7 gap-2">
        {weekDays.map((date) => {
          const dayAppointments = getAppointmentsForDay(date);
          const isCurrentDay = isSameDay(date, new Date());
          const isSelected = isSameDay(date, selectedDate);
          
          return (
            <div 
              key={date.toString()}
              className={`border rounded-md overflow-hidden cursor-pointer transition-colors ${
                isCurrentDay ? 'border-blue-500' : ''
              } ${
                isSelected ? 'bg-blue-50 border-blue-500' : ''
              }`}
              onClick={() => setSelectedDate(date)}
            >
              <div className={`p-2 text-center ${
                isCurrentDay ? 'bg-blue-500 text-white' : 'bg-gray-50'
              }`}>
                <p className="text-sm font-medium">{format(date, 'E')}</p>
                <p className="text-xl">{format(date, 'd')}</p>
              </div>
              <div className="p-2 h-24 overflow-y-auto bg-white">
                {dayAppointments.length > 0 ? (
                  <ul className="space-y-1">
                    {dayAppointments.map((apt) => (
                      <li key={apt.id} className="text-xs px-1 py-1 rounded bg-blue-50 truncate">
                        {apt.time} - {apt.patientName}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-center text-muted-foreground mt-6">No appointments</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
      
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline" className="w-full">
            View Monthly Calendar
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Monthly Calendar View</DialogTitle>
          </DialogHeader>
          <div className="p-4">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              className="rounded-md border p-3 pointer-events-auto"
              modifiers={{
                appointment: datesWithAppointments
              }}
              modifiersStyles={{
                appointment: {
                  fontWeight: 'bold',
                  color: '#3b82f6',
                  textDecoration: 'underline'
                }
              }}
            />
          </div>
        </DialogContent>
      </Dialog>
      
      <Card>
        <CardHeader>
          <CardTitle>
            Appointments for {format(selectedDate, 'MMMM d, yyyy')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {appointmentsForSelectedDate.length > 0 ? (
            <ul className="space-y-3">
              {appointmentsForSelectedDate.map((appointment) => (
                <li key={appointment.id} className="p-3 border rounded-md bg-white">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{appointment.patientName}</p>
                      <p className="text-sm text-muted-foreground">{appointment.time} - {appointment.reason}</p>
                    </div>
                    <Badge variant={
                      appointment.status === "confirmed" ? "default" :
                      appointment.status === "completed" ? "secondary" :
                      appointment.status === "pending" ? "outline" : "destructive"
                    }>
                      {appointment.status}
                    </Badge>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-center py-6 text-muted-foreground">No appointments scheduled for this day</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
