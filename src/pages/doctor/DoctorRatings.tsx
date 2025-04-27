
import { NavBar } from "@/components/layout/NavBar";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Star } from "lucide-react";
import { toast } from "sonner"; // Import toast
import { Skeleton } from "@/components/ui/skeleton"; // Import Skeleton

const API_URL = "http://localhost:3001/api";

interface Rating {
  id: string;
  doctorId: string;
  patientName: string;
  rating: number;
  review: string; // Changed from comment to review to match backend
  createdAt: string; // Changed from date to createdAt
  appointmentId?: string; // Added appointmentId
}

const DoctorRatings = () => {
  const navigate = useNavigate();
  const [ratings, setRatings] = useState<Rating[]>([]); // Initialize as empty array
  const [loading, setLoading] = useState(true); // Add loading state
  const [error, setError] = useState<string | null>(null); // Add error state

  useEffect(() => {
    // Check if user is authenticated and the right type
    const isAuthenticated = localStorage.getItem("isAuthenticated") === "true";
    const userType = localStorage.getItem("userType");
    const token = localStorage.getItem("token");

    if (!isAuthenticated || userType !== "doctor" || !token) {
      toast.error("Authentication required. Redirecting to login.");
      navigate("/login");
      return;
    }

    const fetchRatings = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(`${API_URL}/ratings`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch ratings");
        }

        const data = await response.json();
        // Map backend data to frontend Rating interface
        const formattedRatings = data.map((r: any) => ({
          id: r.id.toString(),
          doctorId: r.doctorId.toString(),
          patientName: r.patientName || 'Anonymous',
          rating: r.rating,
          review: r.review || '',
          createdAt: r.createdAt,
          appointmentId: r.appointmentId?.toString(),
        }));
        setRatings(formattedRatings);
      } catch (err: any) {
        console.error("Error fetching ratings:", err);
        setError(err.message || "An error occurred while fetching ratings.");
        toast.error(err.message || "Failed to load ratings");
      } finally {
        setLoading(false);
      }
    };

    fetchRatings();
  }, [navigate]);

  const renderStars = (rating: number) => {
    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${star <= rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
              }`}
          />
        ))}
      </div>
    );
  };

  const calculateAverageRating = () => {
    if (ratings.length === 0) return 0;
    const sum = ratings.reduce((total, rating) => total + rating.rating, 0);
    return Math.round((sum / ratings.length) * 10) / 10;
  };

  const averageRating = calculateAverageRating();

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      <div className="container px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-1">My Ratings & Feedback</h1>
          <p className="text-muted-foreground">
            View ratings and feedback from your patients
          </p>
        </div>

        {loading ? (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Overall Rating</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <Skeleton className="h-20 w-20 rounded-full" />
                <div>
                  <Skeleton className="h-5 w-24 mb-1" />
                  <Skeleton className="h-4 w-32" />
                </div>
              </div>
            </CardContent>
          </Card>
        ) : error ? (
          <Card className="mb-6 bg-red-50 border-red-200">
            <CardContent className="py-6">
              <p className="text-center text-red-600">Error: {error}</p>
            </CardContent>
          </Card>
        ) : (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Overall Rating</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="bg-gray-100 rounded-full h-20 w-20 flex items-center justify-center">
                  <span className="text-3xl font-bold">{averageRating.toFixed(1)}</span>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    {renderStars(averageRating)}
                    <span className="text-sm text-muted-foreground">
                      Based on {ratings.length} {ratings.length === 1 ? 'review' : 'reviews'}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Patient Feedback</h2>

          {loading ? (
            <div className="space-y-4">
              {[1, 2].map(i => (
                <Card key={i}>
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start mb-2">
                      <Skeleton className="h-5 w-32" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                    <Skeleton className="h-4 w-full mt-2" />
                    <Skeleton className="h-4 w-3/4 mt-1" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-600">
              Could not load feedback.
            </div>
          ) : ratings.length > 0 ? (
            <div className="space-y-4">
              {ratings.map((rating) => (
                <Card key={rating.id}>
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="font-medium">{rating.patientName}</div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(rating.createdAt).toLocaleDateString()}
                          {rating.appointmentId && (
                            <span className="ml-2 text-xs text-gray-500">(Appt ID: {rating.appointmentId})</span>
                          )}
                        </div>
                      </div>
                      <div>{renderStars(rating.rating)}</div>
                    </div>
                    <p className="text-sm mt-2">{rating.review}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No ratings or feedback yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DoctorRatings;
