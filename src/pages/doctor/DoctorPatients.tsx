
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PatientRecords } from "@/components/dashboard/PatientRecords";
import { NavBar } from "@/components/layout/NavBar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { FileText, MessageSquare, Phone, Search, UserPlus, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { Textarea } from "@/components/ui/textarea";
import api from "@/services/api";

interface Patient {
  id: string;
  name: string;
  age: number | string;
  gender?: string;
  lastVisit: string | null;
  conditions: string[];
}

const DoctorPatients = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [selectedPatient, setSelectedPatient] = useState<string | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [showRecordDialog, setShowRecordDialog] = useState(false);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [selectedAppointment, setSelectedAppointment] = useState<string>("no-appointments");
  const [diagnosis, setDiagnosis] = useState("");
  const [prescription, setPrescription] = useState("");
  const [notes, setNotes] = useState("");
  const [recordLoading, setRecordLoading] = useState(false);

  // Fetch doctor's patients
  useEffect(() => {
    const fetchPatients = async () => {
      try {
        setLoading(true);
        setError(null);
        const token = localStorage.getItem("token");

        if (!token) {
          navigate("/login");
          return;
        }

        // Fetch patients using the API service
        const data = await api.getDoctorPatients();
        setPatients(data);
      } catch (err: any) {
        console.error("Error fetching patients:", err);
        setError(err.message || "Failed to load patients");
      } finally {
        setLoading(false);
      }
    };

    fetchPatients();
  }, [navigate]);

  useEffect(() => {
    // Check if user is authenticated and the right type
    const isAuthenticated = localStorage.getItem("isAuthenticated") === "true";
    const userType = localStorage.getItem("userType");

    if (!isAuthenticated || userType !== "doctor") {
      navigate("/login");
    }
  }, [navigate]);

  useEffect(() => {
    if (selectedPatient) {
      console.log("Selected patient:", selectedPatient);
      // Fetch completed appointments for the selected patient
      const fetchAppointments = async () => {
        try {
          setAppointments([]);
          const token = localStorage.getItem("token");
          if (!token) return;
          // Fetch appointments for this patient with status 'completed' that don't have medical records yet
          const response = await api.get(`/appointmentRecord?patientId=${selectedPatient}&status=completed&noMedicalRecord=true`, token);
          if (response && Array.isArray(response)) {
            setAppointments(response);
          } else {
            console.error("Invalid appointments response format");
            setAppointments([]);
          }
        } catch (err) {
          console.error("Error fetching appointments:", err);
          setAppointments([]);
        }
      };
      fetchAppointments();
    } else {
      setAppointments([]);
      setSelectedAppointment("no-appointments");
    }
  }, [selectedPatient]);

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('');
  };

  const handleUploadRecord = async () => {
    if (!selectedAppointment || selectedAppointment === "no-appointments" || !diagnosis) {
      toast({ title: "All required fields must be filled.", variant: "destructive" });
      return;
    }
    setRecordLoading(true);
    try {
      // Find the selected appointment to get its date
      const selectedAppointmentData = appointments.find(apt => apt.id === selectedAppointment);
      const appointmentDate = selectedAppointmentData?.date || new Date().toISOString();
      
      await api.addMedicalRecord({
        patientId: selectedPatient,
        appointmentId: selectedAppointment,
        appointmentDate,
        diagnosis,
        prescription,
        notes
      });
      toast({ title: "Medical record uploaded successfully!" });
      setShowRecordDialog(false);
      setDiagnosis("");
      setPrescription("");
      setNotes("");
      setSelectedAppointment("");
    } catch (err: any) {
      toast({ title: err.message || "Failed to upload medical record.", variant: "destructive" });
    } finally {
      setRecordLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      <div className="container px-4 py-8">
        <div className="mb-8 flex flex-wrap justify-between items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-1">Patients</h1>
            <p className="text-muted-foreground">
              Manage your patient records
            </p>
          </div>
          {/* <Button className="bg-hospital-green hover:bg-green-700">
            <UserPlus className="mr-2 h-4 w-4" />
            Add New Patient
          </Button> */}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Patient List</CardTitle>
              <CardDescription>Search and select a patient to view their records</CardDescription>
              <div className="relative mt-4">
                <Search className="absolute left-2 top-3 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search patients..." className="pl-8" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {loading ? (
                  <div className="flex justify-center p-4">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : error ? (
                  <div className="text-center text-red-500 p-4">{error}</div>
                ) : patients.length === 0 ? (
                  <div className="text-center text-muted-foreground p-4">No patients found</div>
                ) : (
                  patients.map((patient) => (
                    <div
                      key={patient.id}
                      className={`p-3 rounded-lg cursor-pointer transition-colors ${
                        selectedPatient === patient.id
                          ? 'bg-hospital-blue text-white'
                          : 'bg-white border hover:border-hospital-blue'
                      }`}
                      onClick={() => setSelectedPatient(patient.id)}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className={selectedPatient === patient.id ? "border-2 border-white" : "border"}>
                          <AvatarFallback className={selectedPatient === patient.id ? "bg-blue-700" : ""}>
                            {getInitials(patient.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h4 className="font-medium">{patient.name}</h4>
                          <p className={`text-xs ${selectedPatient === patient.id ? 'text-blue-100' : 'text-muted-foreground'}`}>
                            {patient.age} years • {patient.gender}
                          </p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {patient.conditions.map((condition, i) => (
                              <span
                                key={i}
                                className={`text-xs px-1.5 py-0.5 rounded-full ${
                                  selectedPatient === patient.id
                                    ? 'bg-blue-700'
                                    : 'bg-hospital-blue-light text-blue-800'
                                }`}
                              >
                                {condition}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className={`flex justify-between mt-2 text-xs ${
                        selectedPatient === patient.id ? 'text-blue-100' : 'text-muted-foreground'
                      }`}>
                        <span>Last visit: {new Date(patient.lastVisit ?? "").toLocaleDateString()}</span>
                        <div className="flex gap-2">
                          <MessageSquare className="h-4 w-4 cursor-pointer hover:text-hospital-blue" />
                          <Phone className="h-4 w-4 cursor-pointer hover:text-hospital-blue" />
                          <FileText className="h-4 w-4 cursor-pointer hover:text-hospital-blue" />
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          <div className="lg:col-span-2">
            {selectedPatient ? (
              <>
                <div className="flex justify-end mb-4">
                  <Button variant="outline" onClick={() => setShowRecordDialog(true)}>
                    <FileText className="mr-2 h-4 w-4" /> Upload Medical Record
                  </Button>
                </div>
                <Dialog open={showRecordDialog} onOpenChange={(open) => {
                  setShowRecordDialog(open);
                  if (!open) {
                    // Reset form when dialog is closed
                    setSelectedAppointment("no-appointments");
                    setDiagnosis("");
                    setPrescription("");
                    setNotes("");
                  }
                }}>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Upload Medical Record</DialogTitle>
                      <DialogDescription>
                        Select the completed appointment and fill in the required information.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <Label htmlFor="appointment">Appointment</Label>
                      <Select value={selectedAppointment} onValueChange={setSelectedAppointment}>
                        <SelectTrigger id="appointment">
                          <SelectValue placeholder="Select appointment" />
                        </SelectTrigger>
                        <SelectContent>
                          {appointments.length === 0 ? (
                            <SelectItem value="no-appointments" disabled>No appointment without medical record</SelectItem>
                          ) : (
                            appointments.map((apt: any) => {
                              const formattedDate = apt.date ? new Date(apt.date).toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false }) : '';
                              return (
                                <SelectItem key={apt.id} value={apt.id}>{formattedDate} - {apt.type}</SelectItem>
                              );
                            })
                          )}
                        </SelectContent>
                      </Select>
                      <Label htmlFor="diagnosis">Diagnosis *</Label>
                      <Input id="diagnosis" value={diagnosis} onChange={e => setDiagnosis(e.target.value)} required />
                      <Label htmlFor="prescription">Prescription</Label>
                      <Textarea id="prescription" value={prescription} onChange={e => setPrescription(e.target.value)} />
                      <Label htmlFor="notes">Notes</Label>
                      <Textarea id="notes" value={notes} onChange={e => setNotes(e.target.value)} />
                    </div>
                    <DialogFooter>
                      <Button onClick={handleUploadRecord} disabled={recordLoading}>
                        {recordLoading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : null}
                        Upload Record
                      </Button>
                      <DialogClose asChild>
                        <Button variant="outline">Cancel</Button>
                      </DialogClose>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                <PatientRecords userType="doctor" patientId={selectedPatient} />
              </>
            ) : (
              <Card className="h-full flex items-center justify-center p-6">
                <div className="text-center max-w-md">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-medium mb-2">Select a Patient</h3>
                  <p className="text-muted-foreground">
                    Select a patient from the list to view their medical records, manage appointments,
                    and update their information.
                  </p>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorPatients;
