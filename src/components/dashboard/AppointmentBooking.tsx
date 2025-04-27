
import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { CheckCircle, Calendar as CalendarIcon } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
const API_URL = "http://localhost:3001/api";
// State for available doctors
// const [availableDoctors, setAvailableDoctors] = useState<Array<{
//   doctorId: number;
//   firstName: string;
//   lastName: string;
//   specialization: string;
//   hospital: string;
// }>>([]);

// Mock available time slots
const availableTimeSlots = [
  "09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM", 
  "11:00 AM", "11:30 AM", "01:00 PM", "01:30 PM",
  "02:00 PM", "02:30 PM", "03:00 PM", "03:30 PM",
  "04:00 PM", "04:30 PM"
];

interface AppointmentBookingProps {
  onClose: () => void;
  onAppointmentBooked: (appointment: any) => void;
}

export function AppointmentBooking({ onClose, onAppointmentBooked }: AppointmentBookingProps) {
  const [availableDoctors, setAvailableDoctors] = useState<Array<{
    doctorId: number;
    firstName: string;
    lastName: string;
    specialization: string;
    hospital: string;
  }>>([]);
  const [step, setStep] = useState(1);
  const [selectedDoctor, setSelectedDoctor] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState("");
  const [appointmentType, setAppointmentType] = useState<"in-person" | "virtual">("in-person");
  const [reason, setReason] = useState("");
  const [insuranceInfo, setInsuranceInfo] = useState("");
  const [additionalNotes, setAdditionalNotes] = useState("");
  
  // Fetch active doctors on component mount
  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          toast.error('Authentication required');
          return;
        }
        const response = await fetch('http://localhost:3001/api/doctors/active', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await response.json();
        setAvailableDoctors(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Error fetching doctors:', error);
        setAvailableDoctors([]);
        toast.error('Failed to load doctors');
      }
    };
    fetchDoctors();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (step < 4) {
      setStep(step + 1);
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Authentication required');
        return;
      }

      // Format date and time properly for MySQL datetime format
      const appointmentDate = selectedDate ? format(selectedDate, "yyyy-MM-dd") : "";
      const appointmentTime = selectedTime;
      const userId = localStorage.getItem("userId");
      
      if (!userId) {
        toast.error('User ID not found');
        return;
      }
      
      // Create a new appointment with the correct format for the server
      const appointmentData = {
        userId: userId, // Send userId instead of patientId
        doctorId: selectedDoctor,
        appointmentDate, // Send date separately
        appointmentTime, // Send time separately
        appointmentType: appointmentType,
        reason: reason,
        notes: additionalNotes,
        insuranceInfo: insuranceInfo
      };
  
      
      const response = await fetch(`${API_URL}/appointmentBook`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(appointmentData)
      });

      if (!response.ok) {
        throw new Error(`Failed to book appointment ${appointmentData.appointmentDate}`);
      }

      onAppointmentBooked(appointmentData);
      toast.success('Appointment booked successfully!');
      onClose();
    } catch (error) {
      console.error('Error booking appointment:', error);
      toast.error('Failed to book appointment');
    }
  };
  
  const isStepValid = () => {
    switch (step) {
      case 1:
        return selectedDoctor !== null;
      case 2:
        return selectedDate !== undefined && selectedTime !== "";
      case 3:
        return reason !== "";
      default:
        return true;
    }
  };
  
  return (
    <div className="max-w-2xl mx-auto p-4">
      {/* Progress bar */}
      <div className="mb-8">
        <div className="flex justify-between">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex flex-col items-center">
              <div 
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  step >= i ? "bg-hospital-blue text-white" : "bg-gray-200"
                }`}
              >
                {step > i ? <CheckCircle className="w-5 h-5" /> : i}
              </div>
              <span className="text-xs mt-1 text-muted-foreground">
                {i === 1 ? "Doctor" : i === 2 ? "Date & Time" : i === 3 ? "Reason" : "Confirm"}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-hospital-blue transition-all duration-300"
            style={{ width: `${(step - 1) * 33.33}%` }}
          ></div>
        </div>
      </div>
      
      <form onSubmit={handleSubmit}>
        {/* Step 1: Select Doctor */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Select a Doctor</h2>
            <div className="grid gap-4">
              {Array.isArray(availableDoctors) && availableDoctors.length > 0 ? (
                availableDoctors.map((doctor) => (
                  <div 
                    key={doctor.doctorId}
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      selectedDoctor === doctor.doctorId 
                        ? "border-hospital-blue bg-blue-50" 
                        : "hover:border-gray-400"
                    }`}
                    onClick={() => setSelectedDoctor(doctor.doctorId)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">Dr. {doctor.firstName} {doctor.lastName}</h3>
                        <p className="text-sm text-muted-foreground">{doctor.specialization}</p>
                        <p className="text-sm text-muted-foreground">{doctor.hospital}</p>
                      </div>
                      {selectedDoctor === doctor.doctorId && (
                        <CheckCircle className="w-5 h-5 text-hospital-blue" />
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-muted-foreground text-center">No doctors available.</div>
              )}
            </div>
          </div>
        )}
        
        {/* Step 2: Select Date and Time */}
        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Select Date and Time</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <Label className="mb-2 block">Select a Date</Label>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  disabled={(date) => {
                    // Disable past dates and weekends
                    const day = date.getDay();
                    return date < new Date() || day === 0 || day === 6;
                  }}
                  className="rounded-md border p-3 pointer-events-auto"
                />
              </div>
              
              <div>
                <Label className="mb-2 block">Select a Time</Label>
                <div className="grid grid-cols-2 gap-2">
                  {availableTimeSlots.map((time) => (
                    <button
                      key={time}
                      type="button"
                      className={`p-2 border rounded text-sm transition-colors ${
                        selectedTime === time 
                          ? "bg-hospital-blue text-white border-hospital-blue" 
                          : "hover:border-gray-400"
                      }`}
                      onClick={() => setSelectedTime(time)}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="mt-6">
              <Label className="mb-2 block">Appointment Type</Label>
              <RadioGroup 
                defaultValue="in-person"
                value={appointmentType}
                onValueChange={(value: "in-person" | "virtual") => setAppointmentType(value)}
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="in-person" id="in-person" />
                  <Label htmlFor="in-person">In-person visit</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="virtual" id="virtual" />
                  <Label htmlFor="virtual">Virtual consultation</Label>
                </div>
              </RadioGroup>
            </div>
          </div>
        )}
        
        {/* Step 3: Reason for Visit */}
        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Reason for Visit</h2>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="reason">Primary Reason *</Label>
                <Textarea 
                  id="reason" 
                  placeholder="Please describe the reason for your visit"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="h-24"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="insurance">Insurance Information</Label>
                <Input 
                  id="insurance" 
                  placeholder="Insurance provider and member ID"
                  value={insuranceInfo}
                  onChange={(e) => setInsuranceInfo(e.target.value)}
                />
              </div>
              
              <div>
                <Label htmlFor="notes">Additional Notes</Label>
                <Textarea 
                  id="notes" 
                  placeholder="Any additional information you want to share"
                  value={additionalNotes}
                  onChange={(e) => setAdditionalNotes(e.target.value)}
                  className="h-24"
                />
              </div>
            </div>
          </div>
        )}
        
        {/* Step 4: Confirmation */}
        {step === 4 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Confirm Your Appointment</h2>
            
            <div className="border rounded-lg p-4 bg-gray-50">
              <h3 className="font-medium text-lg mb-4">Appointment Details</h3>
              
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-2">
                  <p className="text-muted-foreground">Doctor:</p>
                  <p className="col-span-2 font-medium">
                    {(() => {
                      const doc = availableDoctors.find(doc => doc.doctorId === selectedDoctor);
                      return doc ? `Dr. ${doc.firstName} ${doc.lastName}` : "";
                    })()}
                  </p>
                </div>
                
                <div className="grid grid-cols-3 gap-2">
                  <p className="text-muted-foreground">Specialization:</p>
                  <p className="col-span-2">
                    {availableDoctors.find(doc => doc.doctorId === selectedDoctor)?.specialization}
                  </p>
                </div>
                
                <div className="grid grid-cols-3 gap-2">
                  <p className="text-muted-foreground">Date:</p>
                  <p className="col-span-2">
                    {selectedDate ? format(selectedDate, "MMMM d, yyyy") : ""}
                  </p>
                </div>
                
                <div className="grid grid-cols-3 gap-2">
                  <p className="text-muted-foreground">Time:</p>
                  <p className="col-span-2">{selectedTime}</p>
                </div>
                
                <div className="grid grid-cols-3 gap-2">
                  <p className="text-muted-foreground">Type:</p>
                  <p className="col-span-2">
                    {appointmentType === "in-person" ? "In-person visit" : "Virtual consultation"}
                  </p>
                </div>
                
                <div className="grid grid-cols-3 gap-2">
                  <p className="text-muted-foreground">Reason:</p>
                  <p className="col-span-2">{reason}</p>
                </div>
                
                {insuranceInfo && (
                  <div className="grid grid-cols-3 gap-2">
                    <p className="text-muted-foreground">Insurance:</p>
                    <p className="col-span-2">{insuranceInfo}</p>
                  </div>
                )}
                
                {additionalNotes && (
                  <div className="grid grid-cols-3 gap-2">
                    <p className="text-muted-foreground">Notes:</p>
                    <p className="col-span-2">{additionalNotes}</p>
                  </div>
                )}
              </div>
              
              <p className="mt-4 text-sm">
                By confirming this appointment, you agree to our cancellation policy. 
                Please cancel at least 24 hours in advance if you cannot make it.
              </p>
            </div>
          </div>
        )}
        
        <div className="flex justify-between mt-8">
          {step > 1 ? (
            <Button 
              type="button" 
              variant="outline"
              onClick={() => setStep(step - 1)}
            >
              Back
            </Button>
          ) : (
            <Button 
              type="button" 
              variant="outline"
              onClick={onClose}
            >
              Cancel
            </Button>
          )}
          
          <Button 
            type="submit"
            disabled={!isStepValid()}
          >
            {step < 4 ? "Continue" : "Confirm Appointment"}
          </Button>
        </div>
      </form>
    </div>
  );
}
