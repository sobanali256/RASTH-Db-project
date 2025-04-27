
import { useEffect, useState } from "react";
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
import { Input } from "@/components/ui/input";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Eye, MoreHorizontal, UserCog, UserMinus, Mail } from "lucide-react";
import { toast } from "sonner";

import axios from "axios";

const API_URL = "http://localhost:3002/api";

export const UsersList = ({ userType }) => {
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const filteredUsers = users.filter(user => {
    const searchLower = searchQuery.toLowerCase();
    return (
      `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchLower) ||
      user.email.toLowerCase().includes(searchLower) ||
      (userType === 'doctor' && user.specialization?.toLowerCase().includes(searchLower))
    );
  });

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("Authentication required");

        let endpoint = "";
        if (userType === "doctor") {
          endpoint = "/admin/doctors";
        } else if (userType === "patient") {
          endpoint = "/admin/patients";
        }

        const response = await axios.get(`${API_URL}${endpoint}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        console.log('API Response:', response.data);
        setUsers(response.data);
      } catch (error) {
        console.error("Failed to fetch users:", error);
      }
    };

    fetchUsers();
  }, [userType]);

  const handleView = (user: any) => {
    setSelectedUser(user);
    setIsDialogOpen(true);
  };

  const handleSendMessage = (id: string) => {
    toast.success(`Message interface for user ${id} would open here`);
  };

  const handleDeactivate = async (user: any) => {
    try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("Authentication required");
        const newStatus = user.status === 'active' ? 'inactive' : 'active';
        
        // Fix: Use /api/admin/status instead of /admin/status
        await axios.put(`${API_URL}/admin/status`, {
            userId: user.userId,
            status: newStatus
        }, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        
        setUsers(prevUsers =>
            prevUsers.map(u =>
                u.id === user.id ? { ...u, status: newStatus } : u
            )
        );
        toast.success(`Status updated to ${newStatus}`);
    } catch (error) {
        console.error("Failed to update status:", error);
        toast.error(error.response?.data?.message || "Failed to update status");
    }
};

  return (
    <>
      <div className="mb-4 max-w-sm">
        <Input
          placeholder={`Search ${userType === 'doctor' ? 'doctors' : 'patients'}...`}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      
      <Table>
        <TableCaption>
          {filteredUsers.length === 0 
            ? `No ${userType === 'doctor' ? 'doctors' : 'patients'} found` 
            : `A list of all registered ${userType === 'doctor' ? 'doctors' : 'patients'}`}
        </TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>
              {userType === "doctor" ? "Specialty" : "Age"}
            </TableHead>
            <TableHead className="hidden md:table-cell">Email</TableHead>
            <TableHead className="hidden md:table-cell">
              {userType === "doctor" ? "Status" : "Last Visit"}
            </TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredUsers.map((user) => (
            <TableRow key={user.id}>
              <TableCell className="font-medium">{user.firstName} {user.lastName}</TableCell>
              <TableCell>
                {userType === "doctor" ? user.specialization : new Date().getFullYear() - new Date(user.dateOfBirth).getFullYear()}
              </TableCell>
              <TableCell className="hidden md:table-cell">{user.email}</TableCell>
              <TableCell className="hidden md:table-cell">
                {userType === "doctor" ? (
                  <Badge 
                    variant={user.status === 'Active' ? 'default' : 'outline'}
                    className={user.status === 'Active' ? 'bg-green-100 text-green-800 hover:bg-green-100' : ''}
                  >
                    {user.status}
                  </Badge>
                ) : (
                  user.lastVisit ? new Date(user.lastVisit).toLocaleDateString() : 'No visits yet'
                )}
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">Open menu</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => handleView(user)}>
                      <Eye className="h-4 w-4 mr-2" />
                      View details
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleSendMessage(user.id)}>
                      <Mail className="h-4 w-4 mr-2" />
                      Send message
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDeactivate(user)}>
                      <UserMinus className="h-4 w-4 mr-2" />
                      {userType === "doctor" ? "Change status" : "Deactivate account"}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
  {selectedUser && (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>User Details</DialogTitle>
        <DialogDescription>
          Complete information about this {userType}.
        </DialogDescription>
      </DialogHeader>
      <div className="grid gap-4 py-4">
        {userType === "doctor" ? (
          <>
            <div className="grid grid-cols-4 items-center gap-4">
              <span className="text-right text-sm font-medium">Name:</span>
              <span className="col-span-3">{selectedUser.firstName} {selectedUser.lastName}</span>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <span className="text-right text-sm font-medium">Specialty:</span>
              <span className="col-span-3">{selectedUser.specialization}</span>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <span className="text-right text-sm font-medium">Email:</span>
              <span className="col-span-3">{selectedUser.email}</span>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <span className="text-right text-sm font-medium">License Number:</span>
              <span className="col-span-3">{selectedUser.licenseNumber || 'Not available'}</span>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <span className="text-right text-sm font-medium">Hospital:</span>
              <span className="col-span-3">{selectedUser.hospital || 'Not available'}</span>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <span className="text-right text-sm font-medium">Status:</span>
              <span className="col-span-3">
                <Badge
                  variant={selectedUser.status === "Active" ? "default" : "outline"}
                  className={selectedUser.status === "Active" ? "bg-green-100 text-green-800 hover:bg-green-100" : ""}
                >
                  {selectedUser.status}
                </Badge>
              </span>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <span className="text-right text-sm font-medium">Experience:</span>
              <span className="col-span-3">{selectedUser.experience} years</span>
            </div>
          </>
        ) : (
          <>
            <div className="grid grid-cols-4 items-center gap-4">
              <span className="text-right text-sm font-medium">Name:</span>
              <span className="col-span-3">{selectedUser.firstName} {selectedUser.lastName}</span>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <span className="text-right text-sm font-medium">Age:</span>
              <span className="col-span-3">{new Date().getFullYear() - new Date(selectedUser.dateOfBirth).getFullYear()}</span>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <span className="text-right text-sm font-medium">Email:</span>
              <span className="col-span-3">{selectedUser.email}</span>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <span className="text-right text-sm font-medium">Address:</span>
              <span className="col-span-3">{selectedUser.address || 'Not available'}</span>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <span className="text-right text-sm font-medium">Date of Birth:</span>
              <span className="col-span-3">{selectedUser.dateOfBirth && !isNaN(new Date(selectedUser.dateOfBirth).getTime()) ? new Date(selectedUser.dateOfBirth).toLocaleDateString() : 'Not available'}</span>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <span className="text-right text-sm font-medium">Last Visit:</span>
              <span className="col-span-3">{selectedUser.lastVisit && !isNaN(new Date(selectedUser.lastVisit).getTime()) ? new Date(selectedUser.lastVisit).toLocaleDateString() : 'No visits yet'}</span>
            </div>
          </>
        )}
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Close</Button>
      </DialogFooter>
    </DialogContent>
  )}
</Dialog>
    </>
  );
};
