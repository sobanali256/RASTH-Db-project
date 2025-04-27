
import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Pill, Activity, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import api from "@/services/api";

interface PatientRecord {
  patientId: string;
  name: string;
  age: number;
  gender: string;
  bloodType: string;
  allergies: string[];
  medicalHistory: {
    condition: string;
    diagnosedDate: string;
    notes: string;
  }[];
  medications: {
    prescription?: string;
    appointmentDate?: string; 
  }[];
  visits: {
    date: string;
    reason: string;
    diagnosis: string;
    doctor: string;
    notes: string;
  }[];
}

interface PatientRecordsProps {
  userType: "doctor" | "patient";
  patientId?: string;
}

export function PatientRecords({ userType, patientId }: PatientRecordsProps) {
  const [patientRecord, setPatientRecord] = useState<PatientRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchPatientRecord = async () => {
      try {
        setLoading(true);
        setError("");
        const token = localStorage.getItem("token");
        if (!token) {
          setError("Authentication required.");
          setLoading(false);
          return;
        }
  
        const userType = localStorage.getItem("userType");
        const userId = localStorage.getItem("userId");
  
        if (userType === "patient") {
          // Only patients have a patientId (different from userId)
          const response = await api.get(`/patients/records`, token);
          setPatientRecord(response);
          console.log("Patient Record:", response);
        } else if (userType === "doctor" && patientId) {
          // Doctor viewing a selected patient's record
          const response = await api.get(`/patients/${patientId}/records`, token);
          setPatientRecord(response);
        } else {
          // For non-patients (doctor, admin), fallback to previous logic
          const response = await api.get(`/doctors/${userId}/records`, token);
          setPatientRecord(response);
        }
        
      } catch (err) {
        console.error(err);
        setError("Failed to load medical records.");
        setPatientRecord(null);
      } finally {
        setLoading(false);
      }
    };
    fetchPatientRecord();
  }, [patientId]);
  

  if (loading) {
    return (
      <div className="py-12 text-center text-gray-500">Loading medical records...</div>
    );
  }

  if (error) {
    return (
      <div className="py-12 text-center text-red-500">{error}</div>
    );
  }

  if (!patientRecord) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Patient Record</CardTitle>
          <CardDescription>No medical records found for this patient.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center text-gray-500">No medical history, medications, or visits available.</div>
        </CardContent>
      </Card>
    );
  }

  // Provide default empty arrays for missing fields to prevent runtime errors
  const allergies = patientRecord.allergies || [];
  const medicalHistory = patientRecord.medicalHistory || [];
  const medications = patientRecord.medications || [];
  const visits = patientRecord.visits || [];
  console.log("Patient Record:", patientRecord);
  // Find last visit with the logged-in doctor (if userType is doctor)
  const loggedInDoctor = localStorage.getItem("userType") === "doctor" ? `${localStorage.getItem("firstName") || ""} ${localStorage.getItem("lastName") || ""}` : null;
  const lastVisitWithDoctor =
    userType === "doctor" && loggedInDoctor
      ? visits.find((v) => v.doctor === loggedInDoctor)
      : visits.length > 0
      ? visits[0]
      : null;

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>Patient Record</CardTitle>
            <CardDescription>Medical history and information</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row gap-6 mb-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 border">
              <AvatarFallback className="text-lg">{patientRecord.name ? patientRecord.name.split(' ').map(n => n[0]).join('') : '?'}</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="text-lg font-medium">{patientRecord.name || 'Unknown'}</h3>
              <p className="text-sm text-muted-foreground">
                {patientRecord.age} years • {patientRecord.gender} • {patientRecord.bloodType}
              </p>
              <div className="flex flex-wrap gap-1 mt-1">
                {allergies.map((allergy, i) => (
                  <Badge key={i} variant="outline" className="bg-red-50 text-red-800 border-red-200">
                    {allergy}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-3 bg-hospital-blue-light rounded-lg">
              <p className="text-xs font-medium text-blue-800">Conditions</p>
              <p className="text-sm mt-1">
                {medicalHistory.map(h => h.condition).join(', ') || 'None'}
              </p>
            </div>
            <div className="p-3 bg-hospital-green-light rounded-lg">
              <p className="text-xs font-medium text-green-800">Active Medications</p>
              <p className="text-sm mt-1">{medications.length} Current</p>
            </div>
            <div className="p-3 bg-gray-100 rounded-lg">
              <p className="text-xs font-medium text-gray-800">Last Visit</p>
              <p className="text-sm mt-1">
                {lastVisitWithDoctor
                  ? new Date(lastVisitWithDoctor.date).toLocaleDateString()
                  : visits.length > 0
                  ? new Date(visits[0].date).toLocaleDateString()
                  : "N/A"}
              </p>
            </div>
          </div>
        </div>
        <Tabs defaultValue="overview">
          <TabsList className="grid grid-cols-3 mb-6">
            <TabsTrigger value="overview">
              <Activity className="h-4 w-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="medications">
              <Pill className="h-4 w-4 mr-2" />
              Medications
            </TabsTrigger>
            <TabsTrigger value="visits">
              <Calendar className="h-4 w-4 mr-2" />
              Visits
            </TabsTrigger>
          </TabsList>
          <TabsContent value="overview">
            <div className="space-y-6">
              <div>
                <h4 className="font-medium mb-2">Medical History</h4>
                {/* <div className="space-y-3">
                  {medicalHistory.length > 0 ? (
                    medicalHistory.map((item, i) => (
                      <div key={i} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex justify-between">
                          <h5 className="font-medium">{item.condition}</h5>
                          <span className="text-sm text-muted-foreground">
                            Diagnosed: {new Date(item.diagnosedDate).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm mt-1">{item.notes || "No notes."}</p>
                      </div>
                    ))
                  ) : (
                    <div className="text-gray-500">No medical history available.</div>
                  )}
                </div> */}
                {/* Show latest diagnosis, note, and appointment date if available */}
                {visits.length > 0 && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <div className="flex justify-between">
                      <span className="font-medium">Diagnosis:</span>
                      <span>{visits[0].diagnosis || "Doctor will upload diagnosis soon"}</span>
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="font-medium">Note:</span>
                      <span>{visits[0].notes || "-"}</span>
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="font-medium">Date:</span>
                      <span>{new Date(visits[0].date).toLocaleDateString()}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
          <TabsContent value="medications">
            <div className="space-y-4">
              {medications.length > 0 ? (
                medications.map((med, i) => (
                  <div key={i} className="p-4 border rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="text-sm">
                        {med.prescription && (
                          <div>
                            <p><b>Prescription:</b> {med.prescription}</p>
                            {visits[0].date && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Appointment Date: {new Date(visits[0].date).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-gray-500">No medications available.</div>
              )}
            </div>
          </TabsContent>
          <TabsContent value="visits">
            <div className="space-y-4">
              {visits.length > 0 ? (
                visits.map((visit, i) => (
                  <div key={i} className="p-4 border rounded-lg">
                    <div className="flex justify-between mb-2">
                      <h5 className="font-medium">{visit.reason}</h5>
                      <span className="text-sm text-muted-foreground">
                        {new Date(visit.date).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm mb-1"><span className="font-medium">Diagnosis:</span> {visit.diagnosis}</p>
                    <p className="text-sm mb-1"><span className="font-medium">Reason:</span> {visit.reason}</p>
                    <p className="text-sm mb-1"><span className="font-medium">Doctor:</span> {visit.doctor}</p>
                    <p className="text-sm mb-2"><span className="font-medium">Note:</span> {visit.notes || "-"}</p>
                  </div>
                ))
              ) : (
                <div className="text-gray-500">No visit records available.</div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
