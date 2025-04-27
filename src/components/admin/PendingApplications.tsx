
import { useState, useEffect } from "react";
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { CheckCircle, XCircle, Eye } from "lucide-react";
import { toast } from "sonner";
import api from "@/services/api";

interface DoctorApplication {
  userId: number;
  doctorId: number;
  firstName: string;
  lastName: string;
  email: string;
  specialization: string;
  licenseNumber?: string;
  hospital?: string;
  createdAt: string;
}

interface PatientApplication {
  userId: number;
  patientId: number;
  firstName: string;
  lastName: string;
  email: string;
  dateOfBirth?: string;
  address?: string;
  createdAt: string;
}

export const PendingApplications = () => {
  const [pendingDoctors, setPendingDoctors] = useState<DoctorApplication[]>([]);
  const [viewDoctor, setViewDoctor] = useState<DoctorApplication | null>(null);
  const [isDoctorDialogOpen, setIsDoctorDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPendingApplications = async () => {
    setLoading(true);
    setError(null);
    try {
      const doctors = await api.getPendingDoctorApplications();
      setPendingDoctors(doctors);
    } catch (err: any) {
      setError(err.message || "Failed to load pending doctor applications");
      toast.error(err.message || "Failed to load pending doctor applications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingApplications();
  }, []);

  const handleApproveDoctor = async (doctorId: number) => {
    try {
      await api.updateDoctorStatus(doctorId, 'active');
      setPendingDoctors(pendingDoctors.filter(app => app.doctorId !== doctorId));
      toast.success("Doctor application approved successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to approve doctor application");
    }
  };

  const handleRejectDoctor = async (doctorId: number) => {
    try {
      await api.updateDoctorStatus(doctorId, 'inactive');
      setPendingDoctors(pendingDoctors.filter(app => app.doctorId !== doctorId));
      toast.success("Doctor application rejected");
    } catch (error: any) {
      toast.error(error.message || "Failed to reject doctor application");
    }
  };

  const handleViewDoctor = (application: DoctorApplication) => {
    setViewDoctor(application);
    setIsDoctorDialogOpen(true);
  };

  return (
    <>
      <Table>
        <TableCaption>
          {pendingDoctors.length === 0 
            ? "No pending doctor applications at this time." 
            : "A list of all pending doctor applications."}
        </TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Specialty</TableHead>
            <TableHead className="hidden md:table-cell">Applied On</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={4} className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-hospital-blue mx-auto"></div>
                <p className="mt-2 text-gray-500">Loading applications...</p>
              </TableCell>
            </TableRow>
          ) : error ? (
            <TableRow>
              <TableCell colSpan={4} className="text-center py-8">
                <p className="text-red-500">{error}</p>
              </TableCell>
            </TableRow>
          ) : (
            pendingDoctors.map(app => (
              <TableRow key={app.doctorId}>
                <TableCell>{app.firstName} {app.lastName}</TableCell>
                <TableCell>{app.specialization}</TableCell>
                <TableCell className="hidden md:table-cell">{new Date(app.createdAt).toLocaleDateString()}</TableCell>
                <TableCell className="text-right space-x-2">
                  <Button size="sm" variant="outline" onClick={() => handleViewDoctor(app)}>
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="default" onClick={() => handleApproveDoctor(app.doctorId)}>
                    <CheckCircle className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => handleRejectDoctor(app.doctorId)}>
                    <XCircle className="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      <Dialog open={isDoctorDialogOpen} onOpenChange={setIsDoctorDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Doctor Application Details</DialogTitle>
          </DialogHeader>
          {viewDoctor && (
            <div className="space-y-2">
              <div><b>Name:</b> {viewDoctor.firstName} {viewDoctor.lastName}</div>
              <div><b>Email:</b> {viewDoctor.email}</div>
              <div><b>Specialization:</b> {viewDoctor.specialization}</div>
              <div><b>License Number:</b> {viewDoctor.licenseNumber || "-"}</div>
              <div><b>Hospital:</b> {viewDoctor.hospital || "-"}</div>
              <div><b>Applied At:</b> {new Date(viewDoctor.createdAt).toLocaleString()}</div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setIsDoctorDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


    </>
  );
};
