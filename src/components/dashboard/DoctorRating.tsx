import { useState, useEffect } from "react";
import { Star, MessageSquare, ChevronDown, ChevronUp, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

const API_URL = "http://localhost:3001/api";

interface Doctor {
  id: string;
  userId: string;
  name: string;
  specialization: string;
  hospital?: string;
  avgRating: number;
  totalReviews: number;
  status: string;
}

interface Rating {
  id: string;
  doctorId: string;
  patientId: string;
  appointmentId?: string;
  patientName: string;
  rating: number;
  comment: string;
  date: Date;
}

interface Appointment {
  id: string;
  doctorId: string;
  doctorName: string;
  date: Date;
  status: string;
  isRated: boolean;
}

export function DoctorRating() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]); // All appointments (used for marking as rated after submission)
  const [unratedAppointments, setUnratedAppointments] = useState<Appointment[]>([]); // Only unrated appointments
  const [loading, setLoading] = useState(true);
  
  const [selectedDoctor, setSelectedDoctor] = useState<string | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<string | null>(null);
  const [newRating, setNewRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [comment, setComment] = useState("");
  const [expandedDoctor, setExpandedDoctor] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPatientName, setCurrentPatientName] = useState("");
  
  // Fetch doctors, ratings, and completed appointments on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        const userId = localStorage.getItem('userId');
        
        if (!token || !userId) {
          toast.error("Authentication required");
          return;
        }
        
        // Fetch user profile to get name
        const profileResponse = await fetch(`${API_URL}/profile`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (profileResponse.ok) {
          const profileData = await profileResponse.json();
          const fullName = `${profileData.user.firstName} ${profileData.user.lastName}`;
          setCurrentPatientName(fullName);
        }
        
        // Fetch active doctors
        const doctorsResponse = await fetch(`${API_URL}/doctors/active`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (doctorsResponse.ok) {
          const doctorsData = await doctorsResponse.json();
          setDoctors(doctorsData.map((doc: any) => ({
            id: doc.doctorId.toString(),
            name: `Dr. ${doc.firstName} ${doc.lastName}`,
            specialization: doc.specialization || 'General Practice',
            hospital: doc.hospital,
            avgRating: doc.avgRating || 0,
            totalReviews: doc.totalReviews || 0,
            status: doc.status
          })));
        }
        
        // Fetch ratings first
        const ratingsResponse = await fetch(`${API_URL}/ratings`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        let ratingsData: any[] = [];
        if (ratingsResponse.ok) {
          ratingsData = await ratingsResponse.json();
          setRatings(ratingsData.map((rating: any) => ({
            id: rating.id.toString(),
            doctorId: rating.doctorId.toString(),
            patientId: rating.patientId.toString(),
            appointmentId: rating.appointmentId?.toString(),
            patientName: rating.patientName || 'Anonymous',
            rating: rating.rating,
            comment: rating.review || '',
            date: new Date(rating.createdAt)
          })));
        }

        console.log("Ratings data:", ratingsData);
        
        // Fetch unrated completed appointments from the new endpoint
        const unratedAppointmentsResponse = await fetch(`${API_URL}/appointments/unrated`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (unratedAppointmentsResponse.ok) {
          const unratedData = await unratedAppointmentsResponse.json();
          // Ensure date is parsed correctly
          const formattedUnrated = unratedData.map((apt: any) => ({
            ...apt,
            date: new Date(apt.date)
          }));
          setUnratedAppointments(formattedUnrated);
          console.log("Fetched unrated appointments:", formattedUnrated);
        } else {
          console.error("Failed to fetch unrated appointments:", unratedAppointmentsResponse.statusText);
          toast.error('Failed to load unrated appointments');
        }
        
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load doctors and ratings');
        
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  // Handle doctor rating
  const handleRateDoctor = (doctorId: string, appointmentId?: string) => {
    setSelectedDoctor(doctorId);
    setSelectedAppointment(appointmentId || null);
    setNewRating(0);
    setComment("");
  };
  
  // Submit rating to backend
  const handleSubmitRating = async () => {
    if (!selectedDoctor || newRating === 0) return;
    
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        toast.error("Authentication required");
        return;
      }
      
      const ratingData = {
        doctorId: selectedDoctor,
        appointmentId: selectedAppointment,
        rating: newRating,
        review: comment
      };
      
      const response = await fetch(`${API_URL}/ratings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(ratingData)
      });
      
      if (response.ok) {
        const newRatingData = await response.json();
        
        // Add the new rating to the state
        const newRatingObj: Rating = {
          id: newRatingData.id || `rating-${Math.random().toString(36).substring(2, 9)}`,
          doctorId: selectedDoctor,
          patientId: localStorage.getItem('userId') || '',
          appointmentId: selectedAppointment || undefined,
          patientName: currentPatientName,
          rating: newRating,
          comment,
          date: new Date()
        };
        
        // Update ratings state with the new rating
        const updatedRatings = [...ratings, newRatingObj];
        setRatings(updatedRatings);
        
        // Update the doctor's average rating
        setDoctors(doctors.map(doctor => {
          if (doctor.id === selectedDoctor) {
            // Get all ratings for this doctor including the new one
            const doctorRatings = updatedRatings.filter(r => r.doctorId === doctor.id);
            const totalRating = doctorRatings.reduce((sum, r) => sum + r.rating, 0);
            const newAvgRating = totalRating / doctorRatings.length;
            
            return {
              ...doctor,
              avgRating: Math.round(newAvgRating * 10) / 10,
              totalReviews: doctor.totalReviews + 1
            };
          }
          return doctor;
        }));
        
        // Remove the rated appointment from the unrated list
        if (selectedAppointment) {
          setUnratedAppointments(prev => prev.filter(apt => apt.id !== selectedAppointment));
        }
        
        toast.success("Thank you for your feedback!");
      } else {
        const errorData = await response.json().catch(() => ({ message: "Failed to submit rating" }));
        toast.error(errorData.message || "Failed to submit rating");
      }
    } catch (error) {
      console.error('Error submitting rating:', error);
      toast.error("Failed to submit rating");
    } finally {
      setSelectedDoctor(null);
      setSelectedAppointment(null);
      setNewRating(0);
      setComment("");
    }
  };
  
  const toggleDoctorDetails = (doctorId: string) => {
    if (expandedDoctor === doctorId) {
      setExpandedDoctor(null);
    } else {
      setExpandedDoctor(doctorId);
    }
  };
  
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('');
  };
  
  const renderStars = (rating: number, size = 4) => {
    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-${size} w-${size} ${
              star <= rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
            }`}
          />
        ))}
      </div>
    );
  };
  
  const getMyRatings = (doctorId: string) => {
    const userId = localStorage.getItem('userId');
    return ratings.filter(r => r.doctorId === doctorId && r.patientId === userId);
  };
  
  // Update each doctor's totalReviews to match actual ratings count
  const doctorsWithCorrectReviewCounts = doctors.map(doctor => {
    const doctorRatings = ratings.filter(r => r.doctorId === doctor.id);
    return {
      ...doctor,
      totalReviews: doctorRatings.length,
      avgRating: doctorRatings.length > 0 
        ? Math.round((doctorRatings.reduce((sum, r) => sum + r.rating, 0) / doctorRatings.length) * 10) / 10
        : 0
    };
  });
  
  // Filter doctors based on search term
  const filteredDoctors = doctorsWithCorrectReviewCounts.filter(doctor => 
    doctor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doctor.specialization.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // The unratedAppointments state is now fetched directly from the API

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-2xl font-bold">Doctor Ratings & Feedback</h2>
        <div className="relative w-full md:w-64">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search doctors..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {unratedAppointments.length > 0 ? (
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Rate Your Recent Appointments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {unratedAppointments.map(apt => (
                <div key={apt.id} className="flex justify-between items-center p-3 bg-white rounded-md border">
                  <div>
                    <p className="font-medium">{apt.doctorName}</p>
                    <p className="text-sm text-muted-foreground">
                      Appointment on {apt.date.toLocaleDateString()}
                    </p>
                  </div>
                  <Button 
                    size="sm" 
                    onClick={() => handleRateDoctor(apt.doctorId, apt.id)}
                  >
                    <Star className="mr-1 h-4 w-4" />
                    Rate
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-gray-50 border-gray-200">
          <CardContent className="py-6">
            <p className="text-center text-muted-foreground">
              You don't have any unrated appointments. Schedule an appointment to provide feedback afterward.
            </p>
          </CardContent>
        </Card>
      )}
      
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <div className="flex justify-between">
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div>
                      <Skeleton className="h-5 w-40" />
                      <Skeleton className="h-4 w-24 mt-1" />
                    </div>
                  </div>
                  <div className="text-right">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-16 mt-1" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <Skeleton className="h-4 w-48" />
                  <div className="flex gap-2">
                    <Skeleton className="h-9 w-24" />
                    <Skeleton className="h-9 w-24" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredDoctors.length > 0 ? (
        <div className="space-y-4">
          {filteredDoctors.map((doctor) => {
            const myRatings = getMyRatings(doctor.id);
            const isExpanded = expandedDoctor === doctor.id;
            const doctorRatings = ratings.filter(r => r.doctorId === doctor.id);
            
            return (
              <Card key={doctor.id}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(doctor.name)}`} />
                        <AvatarFallback>{getInitials(doctor.name)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-medium">{doctor.name}</h3>
                        <p className="text-sm text-muted-foreground">{doctor.specialization}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center justify-end">
                        {renderStars(doctor.avgRating)}
                        <span className="ml-2 text-sm font-medium">{doctor.avgRating.toFixed(1)}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {doctor.totalReviews} {doctor.totalReviews === 1 ? 'review' : 'reviews'}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-sm flex items-center gap-1 text-muted-foreground"
                      onClick={() => toggleDoctorDetails(doctor.id)}
                    >
                      <MessageSquare className="h-4 w-4" />
                      {doctorRatings.length} {doctorRatings.length === 1 ? 'comment' : 'comments'}
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                    <div className="flex gap-2">
                      {myRatings.length > 0 ? (
                        <Badge variant="outline" className="flex items-center gap-1">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          You rated {myRatings[0].rating}/5
                        </Badge>
                      ) : (
                        <Button 
                          size="sm" 
                          onClick={() => handleRateDoctor(doctor.id)}
                        >
                          <Star className="mr-1 h-4 w-4" />
                          Rate
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  {isExpanded && (
                    <div className="mt-4 space-y-3 pt-3 border-t">
                      {doctorRatings.length > 0 ? (
                        doctorRatings.map(rating => (
                          <div key={rating.id} className="p-3 bg-gray-50 rounded-md">
                            <div className="flex justify-between items-start mb-1">
                              <p className="font-medium text-sm">{rating.patientName}</p>
                              <div className="flex items-center">
                                {renderStars(rating.rating, 3)}
                                <span className="ml-1 text-xs">{rating.date.toLocaleDateString()}</span>
                              </div>
                            </div>
                            {rating.comment && <p className="text-sm">{rating.comment}</p>}
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-center text-muted-foreground py-2">No reviews yet</p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          No doctors found matching your search.
        </div>
      )}
      
      {selectedDoctor && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Rate Doctor</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <p className="font-medium mb-2">
                  {doctors.find(d => d.id === selectedDoctor)?.name}
                </p>
                <div className="flex justify-center mb-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-8 w-8 cursor-pointer transition-colors ${
                        star <= (hoverRating || newRating) ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
                      }`}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setNewRating(star)}
                    />
                  ))}
                </div>
                {newRating > 0 && (
                  <Badge className="mb-2">
                    {newRating === 1 ? 'Poor' : 
                     newRating === 2 ? 'Fair' : 
                     newRating === 3 ? 'Good' : 
                     newRating === 4 ? 'Very Good' : 'Excellent'}
                  </Badge>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">
                  Comments (Optional)
                </label>
                <Textarea
                  placeholder="Share your experience with this doctor..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={4}
                />
              </div>
              
              <div className="flex justify-end gap-2 pt-2">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSelectedDoctor(null);
                    setSelectedAppointment(null);
                    setNewRating(0);
                    setComment("");
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleSubmitRating}
                  disabled={newRating === 0}
                >
                  Submit Rating
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}