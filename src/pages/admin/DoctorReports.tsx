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
import { Loader2, Search, Filter, Eye, X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  patientName: string;
  doctorName: string;
  type: "appointment" | "message";
  appointmentId: number | null;
  messageId: number | null;
  issue: string;
  status: "pending" | "resolved";
  createdAt: string;
  remarks?: string;
}

const DoctorReports = () => {
  const navigate = useNavigate();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDoctor, setFilterDoctor] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [doctors, setDoctors] = useState<{id: number, name: string}[]>([]);
  const [doctorReportCounts, setDoctorReportCounts] = useState<{[key: string]: number}>({});
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isResolveDialogOpen, setIsResolveDialogOpen] = useState(false);
  const [remarks, setRemarks] = useState("");
  const [isResolvingReport, setIsResolvingReport] = useState(false);

  // Fetch reports from the API
  const fetchReports = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const userType = localStorage.getItem('userType');
      
      if (!token || userType !== 'admin') {
        navigate('/login');
        return;
      }
      
      // Fetch reports from API
      const reportsResponse = await api.getReports(token);
      setReports(reportsResponse);

      // Calculate report counts per doctor
      const counts = {};
      reportsResponse.forEach((report: Report) => {
        const doctorId = report.doctorId.toString();
        counts[doctorId] = (counts[doctorId] || 0) + 1;
      });
      setDoctorReportCounts(counts);

      // Extract unique doctors from reports
      const uniqueDoctors = Array.from(new Set(reportsResponse.map((report: Report) => report.doctorId)))
        .map(doctorId => {
          const report = reportsResponse.find((r: Report) => r.doctorId === doctorId);
          return {
            id: doctorId,
            name: report ? report.doctorName : `Doctor ${doctorId}`
          };
        });
      setDoctors(uniqueDoctors);
    } catch (error) {
      console.error('Error fetching reports:', error);
      toast.error('Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  // Update report status
  const updateReportStatus = async (reportId: number, newStatus: "pending" | "resolved", remarks: string = "") => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error("Authentication required");
        return;
      }
      
      // Update report status via API
      await api.updateReportStatus(reportId, newStatus, remarks, token);
      
      // Update local state
      setReports(prevReports => 
        prevReports.map(report => 
          report.id === reportId ? { ...report, status: newStatus, remarks } : report
        )
      );
      
      toast.success(`Report status updated to ${newStatus}`);
    } catch (error) {
      console.error('Error updating report status:', error);
      toast.error("Failed to update report status");
    }
  };

  useEffect(() => {
    // Check if user is authenticated and the right type
    const isAuthenticated = localStorage.getItem("isAuthenticated") === "true";
    const userType = localStorage.getItem("userType");
    
    if (!isAuthenticated || userType !== "admin") {
      navigate("/login");
      return;
    }
    
    fetchReports();
  }, [navigate]);

  // Filter reports based on search term, doctor filter, and status filter
  const filteredReports = reports.filter(report => {
    const matchesSearch = 
      report.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.doctorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.issue.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDoctor = filterDoctor === "all" ? true : report.doctorId.toString() === filterDoctor;
    const matchesStatus = filterStatus === "all" ? true : report.status === filterStatus;
    
    return matchesSearch && matchesDoctor && matchesStatus;
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

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      <div className="container px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-1">Doctor Reports</h1>
          <p className="text-muted-foreground">
            Manage and review reports submitted by patients
          </p>
        </div>
        
        <div className="mb-6 flex flex-col md:flex-row gap-4 justify-between">
          <div className="relative max-w-md w-full">
            <Search className="absolute left-2 top-3 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search by patient, doctor, or issue..." 
              className="pl-8 w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="flex gap-2 items-center">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground mr-2">Doctor:</span>
              <Select value={filterDoctor} onValueChange={setFilterDoctor}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Doctors" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Doctors</SelectItem>
                  {doctors.map((doctor) => (
                    <SelectItem key={doctor.id} value={doctor.id.toString()}>
                      {doctor.name} ({doctorReportCounts[doctor.id.toString()] || 0})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex gap-2 items-center">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground mr-2">Status:</span>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Patient Reports</CardTitle>
            <CardDescription>
              Review and manage reports submitted by patients about doctors
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <Loader2 className="animate-spin h-8 w-8 mx-auto text-hospital-blue" />
                <p className="mt-4 text-gray-600">Loading reports...</p>
              </div>
            ) : filteredReports.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No reports found.</p>
                {searchTerm || filterDoctor ? (
                  <p className="text-sm text-gray-400 mt-2">Try adjusting your search or filter criteria.</p>
                ) : (
                  <p className="text-sm text-gray-400 mt-2">No reports have been submitted yet.</p>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredReports.map((report) => (
                  <div 
                    key={report.id} 
                    className="bg-white rounded-lg shadow-md overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border border-gray-100"
                  >
                    <div className="p-4 border-b border-gray-100">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-medium text-gray-900">{report.patientName}</h3>
                          <p className="text-sm text-gray-500">Reported {report.doctorName}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(report.status)}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <Filter className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {report.status === "pending" ? (
                                <DropdownMenuItem onClick={() => {
                                  setSelectedReport(report);
                                  setIsResolvingReport(true);
                                  setIsResolveDialogOpen(true);
                                }}>
                                  Mark as Resolved
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem onClick={() => updateReportStatus(report.id, "pending")}>
                                  Mark as Pending
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                        <span className="capitalize px-2 py-0.5 bg-gray-100 rounded-full">{report.type}</span>
                        <span>{new Date(report.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    
                    <div className="p-4 bg-gray-50 relative overflow-hidden group">
                      <h4 className="text-sm font-medium text-gray-700 mb-1">Issue:</h4>
                      <div className="line-clamp-3 text-sm text-gray-600 group-hover:line-clamp-none transition-all duration-300">
                        {report.issue}
                      </div>
                      {report.issue.length > 100 && (
                        <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-gray-50 to-transparent group-hover:opacity-0 transition-opacity duration-300"></div>
                      )}
                      <div className="mt-3 flex justify-end">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-xs" 
                          onClick={() => {
                            setSelectedReport(report);
                            setIsDialogOpen(true);
                          }}
                        >
                          <Eye className="h-3.5 w-3.5 mr-1" />
                          View Details
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialog for viewing full issue text */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Report Details</DialogTitle>
            <DialogDescription>
              {selectedReport && (
                <div className="text-sm text-muted-foreground">
                  From {selectedReport.patientName} about {selectedReport.doctorName}
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          
          {selectedReport && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium text-gray-700">Report Type:</p>
                  <p className="capitalize">{selectedReport.type}</p>
                </div>
                <div>
                  <p className="font-medium text-gray-700">Date Submitted:</p>
                  <p>{new Date(selectedReport.createdAt).toLocaleString()}</p>
                </div>
                <div>
                  <p className="font-medium text-gray-700">Status:</p>
                  <div className="mt-1">{getStatusBadge(selectedReport.status)}</div>
                </div>
                {selectedReport.appointmentId && (
                  <div>
                    <p className="font-medium text-gray-700">Appointment ID:</p>
                    <p>#{selectedReport.appointmentId}</p>
                  </div>
                )}
              </div>
              
              <div>
                <p className="font-medium text-gray-700 mb-2">Issue Description:</p>
                <div className="max-h-[40vh] overflow-y-auto p-4 border rounded-md bg-gray-50">
                  <p className="whitespace-pre-wrap text-sm">{selectedReport.issue}</p>
                </div>
              </div>
              
              {selectedReport.status === "resolved" && selectedReport.remarks && (
                <div>
                  <p className="font-medium text-gray-700 mb-2">Admin Remarks:</p>
                  <div className="max-h-[20vh] overflow-y-auto p-4 border rounded-md bg-gray-50">
                    <p className="whitespace-pre-wrap text-sm">{selectedReport.remarks}</p>
                  </div>
                </div>
              )}
              
              <div className="border-t pt-4">
                <p className="font-medium text-gray-700 mb-2">Update Status:</p>
                <div className="flex gap-2">
                  <Button 
                    variant={selectedReport.status === "pending" ? "default" : "outline"}
                    size="sm"
                    onClick={() => updateReportStatus(selectedReport.id, "pending")}
                    disabled={selectedReport.status === "pending"}
                  >
                    Mark as Pending
                  </Button>
                  <Button 
                    variant={selectedReport.status === "resolved" ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      if (selectedReport.status === "pending") {
                        setIsResolvingReport(true);
                        setIsDialogOpen(false);
                        setIsResolveDialogOpen(true);
                      }
                    }}
                    disabled={selectedReport.status === "resolved"}
                  >
                    Mark as Resolved
                  </Button>
                </div>
              </div>
            </div>
          )}
          
          <div className="flex justify-end mt-4">
            <DialogClose asChild>
              <Button variant="outline">Close</Button>
            </DialogClose>
          </div>
        </DialogContent>
      </Dialog>

      {/* Resolve Report Dialog */}
      <Dialog open={isResolveDialogOpen} onOpenChange={setIsResolveDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Resolve Report</DialogTitle>
            <DialogDescription>
              Add remarks before resolving this report
            </DialogDescription>
          </DialogHeader>
          
          {selectedReport && isResolvingReport && (
            <div className="space-y-4">
              <div>
                <label htmlFor="remarks" className="block text-sm font-medium mb-2">
                  Remarks <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="remarks"
                  className="w-full min-h-[100px] p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Enter your remarks about this report..."
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                />
                <p className="text-sm text-muted-foreground mt-1">
                  These remarks will be visible to the patient who submitted the report.
                </p>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setIsResolveDialogOpen(false);
                    setRemarks("");
                    setIsResolvingReport(false);
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  className="bg-green-500 hover:bg-green-600"
                  disabled={!remarks.trim()}
                  onClick={() => {
                    if (remarks.trim()) {
                      updateReportStatus(selectedReport.id, "resolved", remarks);
                      setIsResolveDialogOpen(false);
                      setRemarks("");
                      setIsResolvingReport(false);
                    }
                  }}
                >
                  Resolve Report
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DoctorReports;