import { NavBar } from "@/components/layout/NavBar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import api from "@/services/api";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2 } from "lucide-react";

// Form validation schema
const reportFormSchema = z.object({
  doctorId: z.string({
    required_error: "Please select a doctor",
  }),
  type: z.enum(["appointment", "message"], {
    required_error: "Please select a report type",
  }),
  appointmentId: z.string().optional(),
  issue: z.string()
    .min(10, { message: "Issue description must be at least 10 characters" })
    .max(500, { message: "Issue description must not exceed 500 characters" }),
});

type ReportFormValues = z.infer<typeof reportFormSchema>;

interface Doctor {
  id: string;
  firstName: string;
  lastName: string;
}

interface Appointment {
  id: string;
  date: string;
  time: string;
  doctorName: string;
  doctorId: string;
  reason: string;
  status: string;
}

// Message interface removed as per requirements

const PatientReportDoctor = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filteredAppointments, setFilteredAppointments] = useState<Appointment[]>([]);

  // Initialize form
  const form = useForm<ReportFormValues>({
    resolver: zodResolver(reportFormSchema),
    defaultValues: {
      doctorId: "",
      type: "appointment",
      appointmentId: "",
      issue: "",
    },
  });

  // Watch for changes to doctorId and type fields
  const selectedDoctorId = form.watch("doctorId");
  const selectedType = form.watch("type");

  // Fetch doctors the patient has interacted with
  const fetchDoctors = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const userType = localStorage.getItem('userType');
      
      if (!token || userType !== 'patient') {
        navigate('/login');
        return;
      }
      
      // Fetch doctors from the backend
      const doctorsResponse = await api.get('/doctors/active', token);

      const rawDoctors = doctorsResponse; // e.g. [{ doctorId, firstName, lastName, … }]

      // transform into your Doctor[]
      const mapped: Doctor[] = rawDoctors.map(d => ({
        id: String(d.doctorId),    // <-- match the interface & form field
        firstName: d.firstName,
        lastName: d.lastName,
      }));

      setDoctors(mapped);
      
      // Fetch appointments from the backend
      const appointmentsResponse = await api.get('/appointments', token);
      const raw = appointmentsResponse;

      const mappedAppointments: Appointment[] = raw.map(apt => ({
        id: String(apt.id),
        date: apt.date,
        time: apt.time,
        doctorName: apt.doctorName,
        doctorId: String(apt.doctorId),
        reason: apt.reason,
        status: apt.status,
      }));
      setAppointments(mappedAppointments);

      
    } catch (error) {
      console.error('Error fetching doctors:', error);
      toast.error('Failed to load doctors');
    } finally {
      setLoading(false);
    }
  };

  // Filter appointments when doctor selection changes
  useEffect(() => {
    if (selectedDoctorId) {
      setFilteredAppointments(appointments.filter(apt => apt.doctorId === selectedDoctorId));
    } else {
      setFilteredAppointments([]);
    }
  }, [selectedDoctorId, appointments]);

  // Load data on component mount
  useEffect(() => {
    // Check if user is authenticated and the right type
    const isAuthenticated = localStorage.getItem("isAuthenticated") === "true";
    const userType = localStorage.getItem("userType");
    
    if (!isAuthenticated || userType !== "patient") {
      navigate("/login");
      return;
    }
    
    fetchDoctors();
  }, [navigate]);

  // Handle form submission
  const onSubmit = async (data: ReportFormValues) => {
    try {
      setSubmitting(true);
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('userId');
      
      if (!token || !userId) {
        toast.error("Authentication required");
        return;
      }
      
      // Prepare the report data
      const reportData = {
        ...data,
        patientId: userId,
        createdAt: new Date().toISOString()
      };
    
      
      // Submit the report using the API
      await api.submitReport(reportData, token);
      
      toast.success("Report submitted successfully");
      form.reset();
      
      // Reset form fields
      form.setValue('doctorId', '');
      form.setValue('type', 'appointment');
      form.setValue('appointmentId', '');
      // messageId field removed
      form.setValue('issue', '');
    } catch (error) {
      console.error('Error submitting report:', error);
      toast.error("Failed to submit report");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      <div className="container px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-1">Report a Doctor</h1>
          <p className="text-muted-foreground">
            Submit a report about a doctor you've interacted with
          </p>
        </div>
        
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Doctor Report Form</CardTitle>
            <CardDescription>
              Please provide details about your concern
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <Loader2 className="animate-spin h-8 w-8 mx-auto text-hospital-blue" />
                <p className="mt-4 text-gray-600">Loading your information...</p>
              </div>
            ) : doctors.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">You haven't interacted with any doctors yet.</p>
                <p className="text-sm text-gray-400 mt-2">Book an appointment or send a message to a doctor first.</p>
              </div>
            ) : (
              <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="doctorId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Doctor</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        value={field.value || ""}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a doctor" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {doctors.map((doctor) => (
                            <SelectItem key={doctor.id} value={doctor.id}>
                              Dr. {doctor.firstName} {doctor.lastName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Select a doctor you've previously interacted with
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                  
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel>Report Type</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            value={field.value}
                            className="flex flex-col space-y-1"
                          >
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="appointment" />
                              </FormControl>
                              <FormLabel className="font-normal">
                                Appointment
                              </FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="message" />
                              </FormControl>
                              <FormLabel className="font-normal">
                                Message
                              </FormLabel>
                            </FormItem>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {selectedType === "appointment" && selectedDoctorId && (
                    <FormField
                      control={form.control}
                      name="appointmentId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Appointment</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            value={field.value || ""}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select an appointment" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {filteredAppointments.length > 0 ? (
                                filteredAppointments.map((appointment) => (
                                  <SelectItem key={appointment.id} value={appointment.id}>
                                    {new Date(appointment.date).toLocaleDateString()} - {appointment.reason}
                                  </SelectItem>
                                ))
                              ) : (
                                <SelectItem value="none" disabled>
                                  No appointments with this doctor
                                </SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Select the appointment related to your report
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                  
                  {/* We don't need to select a specific message when reporting about messages */}
                  
                  <FormField
                    control={form.control}
                    name="issue"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Issue Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Please describe your issue or complaint in detail" 
                            className="min-h-[120px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          Provide a clear description of your concern
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button type="submit" className="w-full" disabled={submitting}>
                    {submitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      "Submit Report"
                    )}
                  </Button>
                </form>
              </Form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PatientReportDoctor;