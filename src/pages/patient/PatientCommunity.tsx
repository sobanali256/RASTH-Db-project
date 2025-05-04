import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { NavBar } from "@/components/layout/NavBar";
import { toast } from "sonner";
import api from "@/services/api";
import axios from "axios";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Edit, Trash2, MessageSquare } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { 
  AnimatedCard, 
  AnimatedSection, 
  AnimatedList, 
  AnimatedListItem,
  fadeIn,
  slideUp,
  cardHover
} from "@/components/ui/dashboard-animations";

// Define the post schema for form validation
const postSchema = z.object({
  title: z.string().min(3, { message: "Title must be at least 3 characters" }).max(100, { message: "Title must be less than 100 characters" }),
  content: z.string().min(10, { message: "Content must be at least 10 characters" }),
  flair: z.enum(["Informative", "Humor", "General"], { message: "Please select a valid flair" }),
  anonymous: z.boolean().default(false),
});

type PostFormValues = z.infer<typeof postSchema>;

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

export default function PatientCommunity() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [currentPost, setCurrentPost] = useState<Post | null>(null);
  const [filterFlair, setFilterFlair] = useState<string>("all");
  const [currentPatientId, setCurrentPatientId] = useState<number | null>(null);
  const [expandedPosts, setExpandedPosts] = useState<number[]>([]);
  const [postDetailDialogOpen, setPostDetailDialogOpen] = useState(false);
  const navigate = useNavigate();
  
  const createForm = useForm<PostFormValues>({
    resolver: zodResolver(postSchema),
    defaultValues: {
      title: "",
      content: "",
      flair: "General",
      anonymous: false,
    },
  });

  const editForm = useForm<PostFormValues>({
    resolver: zodResolver(postSchema),
    defaultValues: {
      title: "",
      content: "",
      flair: "General",
      anonymous: false,
    },
  });

  // Fetch all community posts
  const fetchPosts = async () => {
    try {
      setLoading(true);
      const data = await api.getCommunityPosts();
      setPosts(data);
    } catch (error) {
      toast.error("Failed to fetch community posts");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Get current patient ID from user ID
  const getCurrentPatientId = async () => {
    try {
      const token = localStorage.getItem("token");
      const userId = localStorage.getItem("userId");
      if (!token || !userId) return null;
      
      // Get patient records which includes the patient ID
      const response = await axios.get(`http://localhost:3001/api/patients/records`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data && response.data.patientId) {
        setCurrentPatientId(response.data.patientId);
        return response.data.patientId;
      }
      return null;
    } catch (error) {
      console.error("Error getting current patient ID:", error);
      return null;
    }
  };

  useEffect(() => {
    // Check if user is authenticated and is a patient
    const isAuthenticated = localStorage.getItem("isAuthenticated") === "true";
    const userType = localStorage.getItem("userType");
    
    if (!isAuthenticated || userType !== "patient") {
      toast.error("You must be logged in as a patient to access this page");
      navigate("/login");
      return;
    }
    
    // Fetch patient ID first, then fetch posts
    const initializeData = async () => {
      await getCurrentPatientId();
      fetchPosts();
    };
    
    initializeData();
  }, [navigate]);

  // Handle create post form submission
  const onCreateSubmit = async (data: PostFormValues) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("You must be logged in to create a post");
        return;
      }
      
      await api.createCommunityPost(data, token);
      toast.success("Post created successfully");
      setCreateDialogOpen(false);
      createForm.reset();
      fetchPosts();
    } catch (error) {
      toast.error("Failed to create post");
      console.error(error);
    }
  };

  // Handle edit post form submission
  const onEditSubmit = async (data: PostFormValues) => {
    try {
      if (!currentPost) return;
      
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("You must be logged in to edit a post");
        return;
      }
      
      await api.updateCommunityPost(currentPost.id, data, token);
      toast.success("Post updated successfully");
      setEditDialogOpen(false);
      fetchPosts();
    } catch (error) {
      toast.error("Failed to update post");
      console.error(error);
    }
  };

  // Handle delete post
  const onDeleteConfirm = async () => {
    try {
      if (!currentPost) return;
      
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("You must be logged in to delete a post");
        return;
      }
      
      await api.deleteCommunityPost(currentPost.id, token);
      toast.success("Post deleted successfully");
      setDeleteDialogOpen(false);
      fetchPosts();
    } catch (error) {
      toast.error("Failed to delete post");
      console.error(error);
    }
  };

  // Open edit dialog and populate form with post data
  const handleEditClick = (post: Post) => {
    setCurrentPost(post);
    editForm.reset({
      title: post.title,
      content: post.content,
      flair: post.flair,
      anonymous: post.anonymous,
    });
    setEditDialogOpen(true);
  };

  // Open delete confirmation dialog
  const handleDeleteClick = (post: Post) => {
    setCurrentPost(post);
    setDeleteDialogOpen(true);
  };

  // Filter posts by flair
  const filteredPosts = filterFlair === "all" 
    ? posts 
    : posts.filter(post => post.flair === filterFlair);

  // Use patient ID to check if post belongs to current user

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

  // Open post detail dialog
  const openPostDetail = (post: Post) => {
    setCurrentPost(post);
    setPostDetailDialogOpen(true);
  };
  
  // Toggle post expansion (for truncated text display)
  const togglePostExpansion = (postId: number) => {
    setExpandedPosts(prev => 
      prev.includes(postId) 
        ? prev.filter(id => id !== postId) 
        : [...prev, postId]
    );
  };

  // Check if post is expanded
  const isPostExpanded = (postId: number) => {
    return expandedPosts.includes(postId);
  };

  // Truncate text if not expanded
  const truncateText = (text: string, postId: number) => {
    const maxLength = 150;
    if (text.length <= maxLength) {
      return text;
    }
    return `${text.substring(0, maxLength)}...`;
  };

  return (
    <>
      <NavBar />
      <div className="container mx-auto py-8 px-4">
      <AnimatedSection className="mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <motion.h1 
              className="text-3xl font-bold mb-2"
              variants={slideUp}
            >
              Patient Community
            </motion.h1>
            <motion.p 
              className="text-gray-600 mb-4"
              variants={fadeIn}
            >
              Connect with other patients, share experiences, and learn from each other.
            </motion.p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
            <Select
              value={filterFlair}
              onValueChange={setFilterFlair}
            >
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by flair" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Flairs</SelectItem>
                <SelectItem value="Informative">Informative</SelectItem>
                <SelectItem value="Humor">Humor</SelectItem>
                <SelectItem value="General">General</SelectItem>
              </SelectContent>
            </Select>
            
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full sm:w-auto">
                  <Plus className="mr-2 h-4 w-4" /> Create Post
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Post</DialogTitle>
                  <DialogDescription>
                    Share your thoughts, questions, or experiences with the community.
                  </DialogDescription>
                </DialogHeader>
                
                <Form {...createForm}>
                  <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="space-y-4">
                    <FormField
                      control={createForm.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Title</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter post title" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={createForm.control}
                      name="content"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Content</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Share your thoughts..."
                              className="min-h-[120px]"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={createForm.control}
                      name="flair"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Flair</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a flair" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Informative">Informative</SelectItem>
                              <SelectItem value="Humor">Humor</SelectItem>
                              <SelectItem value="General">General</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Choose a category for your post.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={createForm.control}
                      name="anonymous"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>
                              Post Anonymously
                            </FormLabel>
                            <FormDescription>
                              Your name will not be displayed with the post.
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />
                    
                    <DialogFooter>
                      <Button type="submit" disabled={createForm.formState.isSubmitting}>
                        {createForm.formState.isSubmitting && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Create Post
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </AnimatedSection>
        
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredPosts.length === 0 ? (
          <AnimatedSection className="text-center py-12">
            <p className="text-gray-500 mb-4">No posts found. Be the first to create a post!</p>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> Create Post
            </Button>
          </AnimatedSection>
        ) : (
          <AnimatedList className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {filteredPosts.map((post, index) => (
                <AnimatedListItem key={post.id} className="h-full">
                  <AnimatedCard 
                    className="h-full border border-gray-200 hover:border-primary/50 transition-colors cursor-pointer"
                    delay={index * 0.05}
                    onClick={(e) => {
                      e.stopPropagation();
                      openPostDetail(post);
                    }}
                  >
                    <Card className="h-full flex flex-col max-h-[400px]" onClick={(e) => {
                      e.stopPropagation();
                      openPostDetail(post);
                    }}>
                      <CardHeader className="cursor-pointer" onClick={(e) => {
                        e.stopPropagation();
                        openPostDetail(post);
                      }}>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-xl font-bold">{post.title}</CardTitle>
                            <CardDescription className="mt-1">
                              Posted by {post.anonymous ? "Anonymous" : post.patientName} • {formatDate(post.createdAt)}
                            </CardDescription>
                          </div>
                          <Badge className={`${getFlairColor(post.flair)} text-white`}>
                            {post.flair}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent 
                        className="flex-grow overflow-hidden cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          openPostDetail(post);
                        }}
                      >
                        <p className="whitespace-pre-line">{truncateText(post.content, post.id)}</p>
                        {post.content.length > 150 && (
                          <div className="mt-2">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-primary hover:text-primary/80"
                              onClick={(e) => {
                                e.stopPropagation();
                                openPostDetail(post);
                              }}
                            >
                              Read more
                            </Button>
                          </div>
                        )}
                      </CardContent>
                      <CardFooter className="flex justify-between border-t pt-4">
                        <div className="flex items-center text-gray-500">
                          <motion.div
                            whileHover={{ rotate: 15 }}
                            className="mr-2"
                          >
                            <MessageSquare className="h-4 w-4" />
                          </motion.div>
                          <span className="text-sm">Community Post</span>
                        </div>
                        {currentPatientId === post.patientId && (
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditClick(post);
                              }}
                            >
                              <Edit className="h-4 w-4 mr-1" /> Edit
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteClick(post);
                              }}
                            >
                              <Trash2 className="h-4 w-4 mr-1" /> Delete
                            </Button>
                          </div>
                        )}
                      </CardFooter>
                    </Card>
                  </AnimatedCard>
                </AnimatedListItem>
              ))}
            </AnimatePresence>
          </AnimatedList>
        )}
      </div>

      {/* Edit Post Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Post</DialogTitle>
            <DialogDescription>
              Update your community post.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter post title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={editForm.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Content</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Share your thoughts..."
                        className="min-h-[120px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={editForm.control}
                name="flair"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Flair</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a flair" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Informative">Informative</SelectItem>
                        <SelectItem value="Humor">Humor</SelectItem>
                        <SelectItem value="General">General</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={editForm.control}
                name="anonymous"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        Post Anonymously
                      </FormLabel>
                      <FormDescription>
                        Your name will not be displayed with the post.
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="submit" disabled={editForm.formState.isSubmitting}>
                  {editForm.formState.isSubmitting && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Update Post
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Post</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this post? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={onDeleteConfirm}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Post Detail Dialog */}
      <Dialog open={postDetailDialogOpen} onOpenChange={setPostDetailDialogOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          {currentPost && (
            <>
              <DialogHeader>
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <DialogTitle className="text-2xl font-bold">{currentPost.title}</DialogTitle>
                    <p className="text-gray-500 mt-1">
                      Posted by {currentPost.anonymous ? "Anonymous" : currentPost.patientName} • {formatDate(currentPost.createdAt)}
                    </p>
                  </div>
                  <Badge className={`${getFlairColor(currentPost.flair)} text-white`}>
                    {currentPost.flair}
                  </Badge>
                </div>
              </DialogHeader>
              
              <div className="mt-4 whitespace-pre-line">
                {currentPost.content}
              </div>
              
              <div className="mt-6 pt-4 border-t flex justify-between items-center">
                <div className="flex items-center text-gray-500">
                  <motion.div
                    whileHover={{ rotate: 15 }}
                    className="mr-2"
                  >
                    <MessageSquare className="h-4 w-4" />
                  </motion.div>
                  <span className="text-sm">Community Post</span>
                </div>
                
                {currentPatientId === currentPost.patientId && (
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setPostDetailDialogOpen(false);
                        handleEditClick(currentPost);
                      }}
                    >
                      <Edit className="h-4 w-4 mr-1" /> Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        setPostDetailDialogOpen(false);
                        handleDeleteClick(currentPost);
                      }}
                    >
                      <Trash2 className="h-4 w-4 mr-1" /> Delete
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )};
