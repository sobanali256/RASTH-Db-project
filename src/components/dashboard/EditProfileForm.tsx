import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  Home, 
  Stethoscope,
  Award,
  Building2,
  FileText,
  Droplet,
  Users
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import api from "@/services/api";

// Common fields for both doctor and patient
const commonProfileSchema = z.object({
  firstName: z.string().min(2, { message: "First name must be at least 2 characters" }),
  lastName: z.string().min(2, { message: "Last name must be at least 2 characters" }),
  email: z.string().email({ message: "Please enter a valid email address" }),
  phone: z.string().min(10, { message: "Phone number must be at least 10 characters" }),
  gender: z.string().min(1, { message: "Please select a gender" }),
});

// Patient-specific fields
const patientProfileSchema = commonProfileSchema.extend({
  dateOfBirth: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Please enter a valid date of birth",
  }),
  address: z.string().min(5, { message: "Address must be at least 5 characters" }),
  medicalHistory: z.string().optional(),
  bloodType: z.string().min(1, { message: "Please select a blood type" }),
});

// Doctor-specific fields
const doctorProfileSchema = commonProfileSchema.extend({
  specialization: z.string().min(2, { message: "Specialization must be at least 2 characters" }),
  licenseNumber: z.string().min(2, { message: "License number must be at least 2 characters" }),
  hospital: z.string().min(2, { message: "Hospital name must be at least 2 characters" }),
  experience: z.string().min(1, { message: "Please enter years of experience" }),
  education: z.string().min(5, { message: "Education details must be at least 5 characters" }),
});

type PatientProfileValues = z.infer<typeof patientProfileSchema>;
type DoctorProfileValues = z.infer<typeof doctorProfileSchema>;

interface EditProfileFormProps {
  userType: "patient" | "doctor";
  onSuccess?: () => void;
}

export function EditProfileForm({ userType, onSuccess }: EditProfileFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const patientForm = useForm<PatientProfileValues>({
    resolver: zodResolver(patientProfileSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      gender: "",
      dateOfBirth: "",
      address: "",
      medicalHistory: "",
      bloodType: "",
    },
  });

  const doctorForm = useForm<DoctorProfileValues>({
    resolver: zodResolver(doctorProfileSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      gender: "",
      specialization: "",
      licenseNumber: "",
      hospital: "",
      experience: "",
      education: "",
    },
  });

  // Fetch user data on component mount
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }
        
        const response = await api.get('/profile', token);
        setUserData(response);
        
        // Populate form with existing data
        if (userType === 'patient' && response.patient) {
          patientForm.reset({
            firstName: response.user?.firstName || "",
            lastName: response.user?.lastName || "",
            email: response.user?.email || "",
            phone: response.user?.phone || "",
            gender: response.patient?.gender || "",
            dateOfBirth: response.patient?.dateOfBirth ? new Date(response.patient.dateOfBirth).toISOString().split('T')[0] : "",
            address: response.patient?.address || "",
            medicalHistory: response.patient?.medicalHistory || "",
            bloodType: response.patient?.bloodType || "",
          });
        } else if (userType === 'doctor' && response.doctor) {
          doctorForm.reset({
            firstName: response.user?.firstName || "",
            lastName: response.user?.lastName || "",
            email: response.user?.email || "",
            phone: response.user?.phone || "",
            gender: response.doctor?.gender || "",
            specialization: response.doctor?.specialization || "",
            licenseNumber: response.doctor?.licenseNumber || "",
            hospital: response.doctor?.hospital || "",
            experience: response.doctor?.experience?.toString() || "",
            education: response.doctor?.education || "",
          });
        }
      } catch (error: any) {
        toast.error(error.message || "Failed to load profile data");
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserData();
  }, [userType, navigate]);

  async function onSubmitPatient(data: PatientProfileValues) {
    setIsSubmitting(true);

    try {
      await api.updateProfile({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        gender: data.gender,
        dateOfBirth: data.dateOfBirth,
        address: data.address,
        medicalHistory: data.medicalHistory,
        bloodType: data.bloodType,
      });
      
      toast.success("Profile updated successfully!");
      if (onSuccess) onSuccess();
    } catch (error: any) {
      toast.error(error.message || "Failed to update profile");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function onSubmitDoctor(data: DoctorProfileValues) {
    setIsSubmitting(true);

    try {
      await api.updateProfile({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        gender: data.gender,
        specialization: data.specialization,
        licenseNumber: data.licenseNumber,
        hospital: data.hospital,
        experience: data.experience,
        education: data.education,
      });
      
      toast.success("Profile updated successfully!");
      if (onSuccess) onSuccess();
    } catch (error: any) {
      toast.error(error.message || "Failed to update profile");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Edit Profile</CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        {userType === "patient" ? (
          <Form {...patientForm}>
            <form onSubmit={patientForm.handleSubmit(onSubmitPatient)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={patientForm.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input className="pl-10" placeholder="John" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={patientForm.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input className="pl-10" placeholder="Doe" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={patientForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input className="pl-10" placeholder="you@example.com" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={patientForm.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input className="pl-10" placeholder="(123) 456-7890" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={patientForm.control}
                  name="dateOfBirth"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date of Birth</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input className="pl-10" type="date" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={patientForm.control}
                  name="gender"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Gender</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <div className="relative">
                            <Users className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                            <SelectTrigger className="pl-10">
                              <SelectValue placeholder="Select gender" />
                            </SelectTrigger>
                          </div>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                          <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={patientForm.control}
                  name="bloodType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Blood Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <div className="relative">
                            <Droplet className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                            <SelectTrigger className="pl-10">
                              <SelectValue placeholder="Select blood type" />
                            </SelectTrigger>
                          </div>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="A+">A+</SelectItem>
                          <SelectItem value="A-">A-</SelectItem>
                          <SelectItem value="B+">B+</SelectItem>
                          <SelectItem value="B-">B-</SelectItem>
                          <SelectItem value="AB+">AB+</SelectItem>
                          <SelectItem value="AB-">AB-</SelectItem>
                          <SelectItem value="O+">O+</SelectItem>
                          <SelectItem value="O-">O-</SelectItem>
                          <SelectItem value="unknown">Unknown</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={patientForm.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Home className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input className="pl-10" placeholder="123 Main St, City, State" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={patientForm.control}
                name="medicalHistory"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Medical History (Optional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Please share any relevant medical history, allergies, or conditions"
                        className="min-h-[100px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button 
                type="submit" 
                className="w-full bg-hospital-blue hover:bg-blue-700"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Updating..." : "Update Profile"}
              </Button>
            </form>
          </Form>
        ) : (
          <Form {...doctorForm}>
            <form onSubmit={doctorForm.handleSubmit(onSubmitDoctor)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={doctorForm.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input className="pl-10" placeholder="John" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={doctorForm.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input className="pl-10" placeholder="Doe" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={doctorForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input className="pl-10" placeholder="doctor@hospital.com" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={doctorForm.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input className="pl-10" placeholder="(123) 456-7890" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={doctorForm.control}
                name="gender"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gender</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <div className="relative">
                          <Users className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <SelectTrigger className="pl-10">
                            <SelectValue placeholder="Select gender" />
                          </SelectTrigger>
                        </div>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                        <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={doctorForm.control}
                  name="specialization"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Specialization</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Stethoscope className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input className="pl-10" placeholder="Cardiology" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={doctorForm.control}
                  name="licenseNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>License Number</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Award className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input className="pl-10" placeholder="LIC12345" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={doctorForm.control}
                  name="hospital"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hospital Affiliation</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Building2 className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input className="pl-10" placeholder="General Hospital" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={doctorForm.control}
                  name="experience"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Years of Experience</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" placeholder="5" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={doctorForm.control}
                name="education"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Education & Qualifications</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <FileText className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Textarea 
                          placeholder="MD from University Medical School, Board Certified in..."
                          className="min-h-[100px] pl-10"
                          {...field} 
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button 
                type="submit" 
                className="w-full bg-hospital-green hover:bg-green-700"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Updating..." : "Update Profile"}
              </Button>
            </form>
          </Form>
        )}
      </CardContent>
    </Card>
  );
}