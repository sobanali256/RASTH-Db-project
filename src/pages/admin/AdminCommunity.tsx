import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { NavBar } from "@/components/layout/NavBar";
import { toast } from "sonner";
import api  from "@/services/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Trash2, AlertTriangle, Eye, Calendar, User, X } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface Post {
  id: number;
  patientId: number;
  title: string;
  content: string;
  flair: "Informative" | "Humor" | "General";
  anonymous: boolean;
  patientName: string;
  createdAt: string;
  updatedAt: string;
}

export default function AdminCommunity() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [postDetailDialogOpen, setPostDetailDialogOpen] = useState(false);
  const [currentPost, setCurrentPost] = useState<Post | null>(null);
  const [filterFlair, setFilterFlair] = useState<string>("all");
  const navigate = useNavigate();
  
  // Fetch all community posts for admin
  const fetchPosts = async () => {
    try {
      setLoading(true);
      const posts = await api.getAdminCommunityPosts();
      setPosts(posts);
    } catch (error) {
      toast.error("Failed to fetch community posts");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Check if user is authenticated as admin
    const isAuthenticated = localStorage.getItem("isAuthenticated") === "true";
    const userType = localStorage.getItem("userType");
    
    if (!isAuthenticated || userType !== "admin") {
      toast.error("You must be logged in as an admin to access this page");
      navigate("/login");
      return;
    }
    
    fetchPosts();
  }, [navigate]);

  // Handle delete post
  const onDeleteConfirm = async () => {
    try {
      if (!currentPost) return;
      
      await api.adminDeleteCommunityPost(currentPost.id);
      
      toast.success("Post deleted successfully");
      setDeleteDialogOpen(false);
      fetchPosts();
    } catch (error) {
      toast.error("Failed to delete post");
      console.error(error);
    }
  };

  // Open delete confirmation dialog
  const handleDeleteClick = (post: Post) => {
    setCurrentPost(post);
    setDeleteDialogOpen(true);
  };

  // Open post detail dialog
  const openPostDetail = (post: Post, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    setCurrentPost(post);
    setPostDetailDialogOpen(true);
  };

  // Truncate text for display
  const truncateText = (text: string, maxLength: number = 150) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  // Filter posts by flair
  const filteredPosts = filterFlair === "all" 
    ? posts 
    : posts.filter(post => post.flair === filterFlair);

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Get flair badge color
  const getFlairColor = (flair: string) => {
    switch (flair) {
      case "Informative":
        return "bg-blue-500";
      case "Humor":
        return "bg-yellow-500";
      case "General":
      default:
        return "bg-gray-500";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <NavBar />
      
      <main className="flex-1 container max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold">Community Posts Management</h1>
              <p className="text-muted-foreground">
                Review and moderate patient community posts
              </p>
            </div>
            
            <Select
              value={filterFlair}
              onValueChange={setFilterFlair}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by flair" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Flairs</SelectItem>
                <SelectItem value="Informative">Informative</SelectItem>
                <SelectItem value="Humor">Humor</SelectItem>
                <SelectItem value="General">General</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-hospital-blue" />
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="text-center py-12">
              <h3 className="text-xl font-medium text-gray-600 mb-2">
                No posts found
              </h3>
              <p className="text-gray-500">
                {filterFlair === "all" 
                  ? "There are no community posts yet."
                  : `No posts with the "${filterFlair}" flair. Try a different filter.`
                }
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPosts.map((post) => (
                <Card key={post.id} className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer" onClick={(e) => openPostDetail(post, e)}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{post.title}</CardTitle>
                      <Badge className={getFlairColor(post.flair)}>
                        {post.flair}
                      </Badge>
                    </div>
                    <CardDescription className="flex items-center gap-2 mt-2">
                      <User className="h-4 w-4" />
                      <span>{post.anonymous ? "Anonymous" : post.patientName}</span>
                      <span className="mx-1">•</span>
                      <Calendar className="h-4 w-4" />
                      <span>{formatDate(post.createdAt)}</span>
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="whitespace-pre-wrap break-words line-clamp-3">
                      {truncateText(post.content)}
                    </p>
                    {post.content.length > 150 && (
                      <Button 
                        variant="link" 
                        className="p-0 h-auto mt-2 text-hospital-blue"
                        onClick={(e) => openPostDetail(post, e)}
                      >
                        Read more
                      </Button>
                    )}
                  </CardContent>
                  <CardFooter className="flex justify-end border-t pt-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteClick(post);
                      }}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Confirm Deletion
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this post? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          {currentPost && (
            <div className="border rounded-md p-4 my-4">
              <h4 className="font-semibold">{currentPost.title}</h4>
              <p className="text-sm text-gray-500 mt-1">
                Posted by {currentPost.anonymous ? "Anonymous" : currentPost.patientName} on {formatDate(currentPost.createdAt)}
              </p>
              <p className="mt-2 text-sm truncate">{currentPost.content}</p>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={onDeleteConfirm}>
              Delete Post
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Post Detail Dialog */}
      <Dialog open={postDetailDialogOpen} onOpenChange={setPostDetailDialogOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <div className="flex justify-between items-start">
              <DialogTitle className="text-xl font-bold">
                {currentPost?.title}
              </DialogTitle>
              <Button 
                variant="ghost" 
                size="icon" 
                className="rounded-full" 
                onClick={() => setPostDetailDialogOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <DialogDescription className="flex flex-wrap items-center gap-2 mt-2">
              <User className="h-4 w-4" />
              <span>{currentPost?.anonymous ? "Anonymous" : currentPost?.patientName}</span>
              <span className="mx-1">•</span>
              <Calendar className="h-4 w-4" />
              <span>{currentPost && formatDate(currentPost.createdAt)}</span>
              <span className="mx-1">•</span>
              {currentPost && (
                <Badge className={getFlairColor(currentPost.flair)}>
                  {currentPost.flair}
                </Badge>
              )}
            </DialogDescription>
          </DialogHeader>
          
          {currentPost && (
            <div className="my-4 overflow-y-auto flex-grow max-h-[50vh] pr-2 border rounded-md p-4 bg-gray-50">
              <div className="whitespace-pre-wrap break-words">
                {currentPost.content}
              </div>
            </div>
          )}
          
          <DialogFooter className="flex-shrink-0 mt-4">
            <Button 
              variant="destructive" 
              onClick={() => {
                setPostDetailDialogOpen(false);
                handleDeleteClick(currentPost!);
              }}
              className="text-white"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Delete Post
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}