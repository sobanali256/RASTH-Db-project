
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
          const response = await api.get(`/doctors/${patientId}/records`, token);
          setPatientRecord(response);
        } else {
          setError("Invalid user type.");
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
  
  // Find last visit with the logged-in doctor (if userType is doctor)
  const loggedInDoctor = localStorage.getItem("userType") === "doctor" ? `${localStorage.getItem("firstName") || ""} ${localStorage.getItem("lastName") || ""}` : null;
  const lastVisitWithDoctor =
    userType === "doctor" && loggedInDoctor
      ? visits.find((v) => v.doctor === loggedInDoctor)
      : visits.length > 0
      ? visits[0]
      : null;

  return (
    <AnimatedCard>
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
          <AnimatedSection className="flex flex-col md:flex-row gap-6 mb-6">
            <div className="flex items-center gap-4">
              <motion.div initial="hidden" animate="visible" variants={fadeIn}>
                <Avatar className="h-16 w-16 border">
                  <AvatarFallback className="text-lg">{patientRecord.name ? patientRecord.name.split(' ').map(n => n[0]).join('') : '?'}</AvatarFallback>
                </Avatar>
              </motion.div>
              <div>
                <motion.h3 
                  className="text-lg font-medium"
                  initial="hidden" 
                  animate="visible" 
                  variants={slideUp}
                >
                  {patientRecord.name || 'Unknown'}
                </motion.h3>
                <motion.p 
                  className="text-sm text-muted-foreground"
                  initial="hidden" 
                  animate="visible" 
                  variants={slideUp}
                  transition={{ delay: 0.1 }}
                >
                  {patientRecord.age} years • {patientRecord.gender} • {patientRecord.bloodType}
                </motion.p>
                <motion.div 
                  className="flex flex-wrap gap-1 mt-1"
                  initial="hidden" 
                  animate="visible" 
                  variants={fadeIn}
                  transition={{ delay: 0.2 }}
                >
                  {allergies.map((allergy, i) => (
                    <EnhancedBadge key={i} variant="danger" className="bg-red-50 text-red-800 border-red-200">
                      {allergy}
                    </EnhancedBadge>
                  ))}
                </motion.div>
              </div>
            </div>
            <AnimatedList className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <AnimatedListItem>
                <motion.div 
                  className="p-3 bg-hospital-blue-light rounded-lg hover:shadow-md transition-shadow"
                  whileHover={{ scale: 1.02 }}
                >
                  <p className="text-xs font-medium text-blue-800">Conditions</p>
                  <p className="text-sm mt-1">
                    {medicalHistory.map(h => h.condition).join(', ') || 'None'}
                  </p>
                </motion.div>
              </AnimatedListItem>
              <AnimatedListItem>
                <motion.div 
                  className="p-3 bg-hospital-green-light rounded-lg hover:shadow-md transition-shadow"
                  whileHover={{ scale: 1.02 }}
                >
                  <p className="text-xs font-medium text-green-800">Active Medications</p>
                  <p className="text-sm mt-1">{medications.length} Current</p>
                </motion.div>
              </AnimatedListItem>
              <AnimatedListItem>
                <motion.div 
                  className="p-3 bg-gray-100 rounded-lg hover:shadow-md transition-shadow"
                  whileHover={{ scale: 1.02 }}
                >
                  <p className="text-xs font-medium text-gray-800">Last Visit</p>
                  <p className="text-sm mt-1">
                    {lastVisitWithDoctor
                      ? new Date(lastVisitWithDoctor.date).toLocaleDateString()
                      : visits.length > 0
                      ? new Date(visits[0].date).toLocaleDateString()
                      : "N/A"}
                  </p>
                </motion.div>
              </AnimatedListItem>
            </AnimatedList>
          </AnimatedSection>
          <AnimatedSection delay={0.3} className="mt-6">
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
                <div className="space-y-3">
                  {medicalHistory.length > 0 ? (
                    medicalHistory.map((item, i) => (
                      <motion.div 
                        key={i} 
                        className="p-3 bg-gray-50 rounded-lg"
                        initial="hidden"
                        animate="visible"
                        variants={slideUp}
                        transition={{ delay: i * 0.1 }}
                        whileHover={{ scale: 1.01, boxShadow: "0 4px 6px rgba(0,0,0,0.05)" }}
                      >
                        <div className="flex justify-between">
                          <h5 className="font-medium">{item.condition}</h5>
                          <span className="text-sm text-muted-foreground">
                            Diagnosed: {new Date(item.diagnosedDate).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm mt-1">{item.notes || "No notes."}</p>
                      </motion.div>
                    ))
                  ) : (
                    <div className="text-gray-500">No medical history available.</div>
                  )}
                </div>
                
                <h4 className="font-medium mb-2 mt-6">Appointment History</h4>
                <AnimatedList className="space-y-3">
                  {visits.length > 0 ? (
                    visits.map((visit, i) => (
                      <AnimatedListItem key={i}>
                        <motion.div 
                          className="p-3 bg-blue-50 rounded-lg"
                          whileHover={{ scale: 1.01, boxShadow: "0 4px 6px rgba(0,0,0,0.05)" }}
                        >
                          <div className="flex justify-between items-center mb-2">
                            <h5 className="font-medium text-blue-800">{visit.reason}</h5>
                            <Badge variant="outline" className="bg-white">
                              {new Date(visit.date).toLocaleDateString()}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            <div>
                              <p className="text-sm"><span className="font-medium">Diagnosis:</span> {visit.diagnosis || "Pending"}</p>
                              <p className="text-sm"><span className="font-medium">Doctor:</span> {visit.doctor}</p>
                            </div>
                            <div>
                              <p className="text-sm"><span className="font-medium">Notes:</span> {visit.notes || "-"}</p>
                              {medications.find(med => med.appointmentDate === visit.date) && (
                                <p className="text-sm mt-1">
                                  <span className="font-medium">Prescription:</span> {medications.find(med => med.appointmentDate === visit.date)?.prescription}
                                </p>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      </AnimatedListItem>
                    ))
                  ) : (
                    <div className="text-gray-500">No appointment records available.</div>
                  )}
                </AnimatedList>
              </div>
            </div>
          </TabsContent>
          <TabsContent value="medications">
            <h4 className="font-medium mb-2">Current Medications</h4>
            <AnimatedList className="space-y-3">
              {medications.length > 0 ? (
                medications.map((med, i) => (
                  <AnimatedListItem key={i}>
                    <motion.div 
                      className="p-3 bg-green-50 rounded-lg"
                      initial="hidden"
                      animate="visible"
                      variants={slideUp}
                      transition={{ delay: i * 0.1 }}
                      whileHover={{ scale: 1.01, boxShadow: "0 4px 6px rgba(0,0,0,0.05)" }}
                    >
                      <div className="flex justify-between items-center mb-2">
                        <h5 className="font-medium text-green-800">Prescription</h5>
                        {med.appointmentDate && (
                          <Badge variant="outline" className="bg-white">
                            {new Date(med.appointmentDate).toLocaleDateString()}
                          </Badge>
                        )}
                      </div>
                      <div className="grid grid-cols-1 gap-2">
                        <p className="text-sm"><span className="font-medium">Medication:</span> {med.prescription || "Not specified"}</p>
                        {med.appointmentDate && (
                          <p className="text-sm">
                            <span className="font-medium">Prescribed on:</span> {new Date(med.appointmentDate).toLocaleDateString()}
                          </p>
                        )}
                        {visits.find(visit => visit.date === med.appointmentDate) && (
                          <p className="text-sm">
                            <span className="font-medium">Prescribed by:</span> {visits.find(visit => visit.date === med.appointmentDate)?.doctor}
                          </p>
                        )}
                      </div>
                    </motion.div>
                  </AnimatedListItem>
                ))
              ) : (
                <div className="text-gray-500">No medications available.</div>
              )}
            </AnimatedList>
          </TabsContent>
          <TabsContent value="visits">
            <h4 className="font-medium mb-2">Visit History</h4>
            <AnimatedList className="space-y-3">
              {visits.length > 0 ? (
                visits.map((visit, i) => (
                  <AnimatedListItem key={i}>
                    <motion.div 
                      className="p-3 bg-blue-50 rounded-lg"
                      initial="hidden"
                      animate="visible"
                      variants={slideUp}
                      transition={{ delay: i * 0.1 }}
                      whileHover={{ scale: 1.01, boxShadow: "0 4px 6px rgba(0,0,0,0.05)" }}
                    >
                      <div className="flex justify-between items-center mb-2">
                        <h5 className="font-medium text-blue-800">{visit.reason}</h5>
                        <Badge variant="outline" className="bg-white">
                          {new Date(visit.date).toLocaleDateString()}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        <div>
                          <p className="text-sm"><span className="font-medium">Diagnosis:</span> {visit.diagnosis || "Pending"}</p>
                          <p className="text-sm"><span className="font-medium">Doctor:</span> {visit.doctor}</p>
                        </div>
                        <div>
                          <p className="text-sm"><span className="font-medium">Notes:</span> {visit.notes || "-"}</p>
                          {medications.find(med => med.appointmentDate === visit.date) && (
                            <p className="text-sm mt-1">
                              <span className="font-medium">Prescription:</span> {medications.find(med => med.appointmentDate === visit.date)?.prescription}
                            </p>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  </AnimatedListItem>
                ))
              ) : (
                <div className="text-gray-500">No visit records available.</div>
              )}
            </AnimatedList>
          </TabsContent>
        </Tabs>
      </AnimatedSection>
    </CardContent>
  </Card>
</AnimatedCard>
  );
}
