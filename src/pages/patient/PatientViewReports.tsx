import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { NavBar } from "@/components/layout/NavBar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2, Search, Eye } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogClose
} from "@/components/ui/dialog";
import api from "@/services/api";

interface Report {
  id: number;
  patientId: number;
  doctorId: number;
  doctorName: string;
  type: "appointment" | "message";
  appointmentId: number | null;
  appointmentDate?: string;
  reason?: string;
  issue: string;
  status: "pending" | "resolved";
  createdAt: string;
  remarks?: string;
}

const PatientViewReports = () => {
  const navigate = useNavigate();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Fetch reports from the API
  const fetchReports = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const userType = localStorage.getItem('userType');
      
      if (!token || userType !== 'patient') {
        navigate('/login');
        return;
      }
      
      // Fetch reports from API
      const reportsResponse = await api.getPatientReports(token);
      setReports(reportsResponse);
    } catch (error) {
      console.error('Error fetching reports:', error);
      toast.error('Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Check if user is authenticated and the right type
    const isAuthenticated = localStorage.getItem("isAuthenticated") === "true";
    const userType = localStorage.getItem("userType");
    
    if (!isAuthenticated || userType !== "patient") {
      navigate("/login");
      return;
    }
    
    fetchReports();
  }, [navigate]);

  // Filter reports based on search term
  const filteredReports = reports.filter(report => {
    const matchesSearch = 
      report.doctorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.issue.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (report.reason && report.reason.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesSearch;
  });

  // Get status badge
  const getStatusBadge = (status: "pending" | "resolved") => {
    switch (status) {
      case "pending":
        return <Badge className="bg-yellow-500">Pending</Badge>;
      case "resolved":
        return <Badge className="bg-green-500">Resolved</Badge>;
      default:
        return null;
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      <div className="container px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-1">My Reports</h1>
          <p className="text-muted-foreground">
            View the status of reports you've submitted
          </p>
        </div>
        
        <div className="mb-6 flex flex-col md:flex-row gap-4 justify-between">
          <div className="relative max-w-md w-full">
            <Search className="absolute left-2 top-3 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search by doctor, issue, or reason..." 
              className="pl-8 w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2">Loading reports...</span>
          </div>
        ) : filteredReports.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <h3 className="text-lg font-medium">No reports found</h3>
                <p className="text-muted-foreground mt-1">
                  {searchTerm ? "Try adjusting your search terms" : "You haven't submitted any reports yet"}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredReports.map(report => (
              <Card key={report.id} className="overflow-hidden hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">
                        Report to {report.doctorName}
                      </CardTitle>
                      <CardDescription>
                        {formatDate(report.createdAt)}
                      </CardDescription>
                    </div>
                    {getStatusBadge(report.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Issue Type</p>
                      <p className="capitalize">{report.type}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Description</p>
                      <p className="line-clamp-2">{report.issue}</p>
                    </div>
                    
                    {report.status === "resolved" && report.remarks && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Admin Remarks</p>
                        <p className="line-clamp-2">{report.remarks}</p>
                      </div>
                    )}
                    
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full mt-2"
                      onClick={() => {
                        setSelectedReport(report);
                        setIsDialogOpen(true);
                      }}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        
        {/* View Report Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Report Details</DialogTitle>
              <DialogDescription>
                View the full details of your report
              </DialogDescription>
            </DialogHeader>
            
            {selectedReport && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Doctor</h3>
                    <p className="text-base">{selectedReport.doctorName}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Report Type</h3>
                    <p className="text-base capitalize">{selectedReport.type}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Status</h3>
                    <div className="mt-1">{getStatusBadge(selectedReport.status)}</div>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Date Submitted</h3>
                    <p className="text-base">{formatDate(selectedReport.createdAt)}</p>
                  </div>
                  
                  {selectedReport.appointmentDate && (
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Appointment Date</h3>
                      <p className="text-base">{formatDate(selectedReport.appointmentDate)}</p>
                    </div>
                  )}
                  
                  {selectedReport.reason && (
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Appointment Reason</h3>
                      <p className="text-base">{selectedReport.reason}</p>
                    </div>
                  )}
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Issue Description</h3>
                  <div className="p-4 bg-gray-50 rounded-md">
                    <p className="whitespace-pre-wrap">{selectedReport.issue}</p>
                  </div>
                </div>
                
                {selectedReport.status === "resolved" && selectedReport.remarks && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Admin Remarks</h3>
                    <div className="p-4 bg-gray-50 rounded-md">
                      <p className="whitespace-pre-wrap">{selectedReport.remarks}</p>
                    </div>
                  </div>
                )}
                
                <div className="flex justify-end">
                  <DialogClose asChild>
                    <Button variant="outline">Close</Button>
                  </DialogClose>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default PatientViewReports;