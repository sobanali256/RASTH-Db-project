import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Send, Paperclip, Search, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const API_URL = "http://localhost:3001/api";

interface Message {
  id: string;
  sender: string;
  recipient: string;
  content: string;
  timestamp: Date;
  read: boolean;
}

interface Contact {
  id: string;        // This should always be userId, not doctorId or patientId
  name: string;
  role: "doctor" | "patient";
  specialization?: string;
}

interface MessagingSystemProps {
  userType: "doctor" | "patient";
}

export function MessagingSystem({ userType }: MessagingSystemProps) {
  const [newMessage, setNewMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedContact, setSelectedContact] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showNewChatDialog, setShowNewChatDialog] = useState(false);
  const [activeDoctors, setActiveDoctors] = useState<any[]>([]);
  
  // State for contacts and messages
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [allMessages, setAllMessages] = useState<{ [key: string]: Message[] }>({});

  // Check if a chat exists with a contact
  const chatExists = (contactId: string) => {
    return allMessages[contactId] && allMessages[contactId].length > 0;
  };

  // Handle contact selection
  const handleContactSelect = (contactId: string) => {
    setSelectedContact(contactId);
    
    // Fetch messages for this contact if not already loaded
    if (currentUserId) {
      fetchMessagesForContact(contactId);
    }
    
    // If this is a new chat with no messages, initialize an empty message array
    if (!allMessages[contactId]) {
      setAllMessages(prev => ({
        ...prev,
        [contactId]: []
      }));
    }
  };

  // Fetch user data and conversations on component mount
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        const userId = localStorage.getItem('userId');
        
        if (!token || !userId) {
          toast.error("Authentication required");
          return;
        }
        
        setCurrentUserId(userId);
        
        // Fetch user profile to get name
        const profileResponse = await fetch(`${API_URL}/profile`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (profileResponse.ok) {
          const profileData = await profileResponse.json();
          const fullName = `${profileData.user.firstName} ${profileData.user.lastName}`;
          const formattedName = userType === 'doctor' ? `Dr. ${fullName}` : fullName;
          setCurrentUser(formattedName);
        }
        
        // Fetch conversations
        const conversationsResponse = await fetch(`${API_URL}/conversations`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (conversationsResponse.ok) {
          const conversationsData = await conversationsResponse.json();
          
          // Transform conversations data to match Contact interface
          const formattedContacts = conversationsData.map((contact: any) => ({
            id: contact.userId.toString(), // Always use userId for consistency
            name: contact.userType === 'doctor' 
              ? `Dr. ${contact.firstName} ${contact.lastName}` 
              : `${contact.firstName} ${contact.lastName}`,
            role: contact.userType,
            specialization: contact.specialization || undefined
          }));
          
          setContacts(formattedContacts);
          
          // If we have contacts, select the first one and fetch messages
          if (formattedContacts.length > 0) {
            const firstContactId = formattedContacts[0].id;
            setSelectedContact(firstContactId);
            fetchMessagesForContact(firstContactId);
          }
        }
        
        // If user is a patient, fetch active doctors for new chat
        if (userType === 'patient') {
          fetchActiveDoctors();
        }
      } catch (error) {
        console.error('Error fetching conversations:', error);
        toast.error('Failed to load conversations');
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserData();
  }, [userType]);
  
  // Fetch messages for a specific contact
  const fetchMessagesForContact = async (contactId: string) => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token || !contactId || !currentUserId) return;
      
      const response = await fetch(`${API_URL}/messages/${contactId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        const messagesData = await response.json();
        
        // Transform messages data
        const formattedMessages = messagesData.map((msg: any) => ({
          id: msg.id.toString(),
          sender: msg.senderId.toString() === currentUserId
            ? currentUser
            : contacts.find(c => c.id === msg.senderId.toString())?.name || 
              (msg.senderFirstName && msg.senderLastName ? 
                (msg.senderUserType === 'doctor' ? 
                  `Dr. ${msg.senderFirstName} ${msg.senderLastName}` : 
                  `${msg.senderFirstName} ${msg.senderLastName}`) : 
                `User ${msg.senderId}`),
          recipient: msg.receiverId.toString() === currentUserId 
            ? currentUser 
            : contacts.find(c => c.id === msg.receiverId.toString())?.name || 'Other User',
          content: msg.content,
          timestamp: new Date(msg.createdAt),
          read: msg.isRead
        }));
        
        // Sort messages by timestamp
        formattedMessages.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
        
        setAllMessages(prev => ({
          ...prev,
          [contactId]: formattedMessages
        }));
      }
    } catch (error) {
      console.error(`Error fetching messages for contact ${contactId}:`, error);
      toast.error('Failed to load messages');
    }
  };
  
  // Fetch active doctors for new chat (patient only)
  const fetchActiveDoctors = async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) return;
      
      const response = await fetch(`${API_URL}/patients/doctors/active`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        const doctorsData = await response.json();
        setActiveDoctors(doctorsData);
        console.log("Active Doctors:", doctorsData);
      }
    } catch (error) {
      console.error('Error fetching active doctors:', error);
    }
  };
  
  // Start a new chat with a doctor (patient only)
  const startNewChatWithDoctor = async (doctor: any) => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error("Authentication required");
      return;
    }
    
    try {
      // Always use userId for backend communication
      const doctorUserId = doctor.userId;
      console.log("Doctor ID:", doctorUserId);
      if (!doctorUserId) {
        toast.error("Invalid doctor selected");
        return;
      }
      
      const response = await fetch(`${API_URL}/conversations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ userId: doctorUserId }) // Send userId instead of doctorId
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Failed to start conversation" }));
        toast.error(errorData.message || "Failed to start conversation");
        return;
      }
      
      const conversationData = await response.json();

      // Create new contact with userId
      const newContact: Contact = {
        id: doctorUserId.toString(),
        name: `Dr. ${doctor.firstName} ${doctor.lastName}`,
        role: 'doctor',
        specialization: doctor.specialization || undefined
      };

      // Add to contacts if not already there
      setContacts(prevContacts => {
        if (prevContacts.some(c => c.id === newContact.id)) {
          return prevContacts;
        }
        return [...prevContacts, newContact];
      });

      setSelectedContact(newContact.id);
      
      // Initialize empty message array if not exists
      if (!allMessages[newContact.id]) {
        setAllMessages(prev => ({
          ...prev,
          [newContact.id]: []
        }));
      }
      
      toast.success("New conversation started");
      setShowNewChatDialog(false);
    } catch (error) {
      console.error('Error starting conversation:', error);
      toast.error("Failed to start conversation");
    }
  };
  
  // Filter contacts based on user type and search term
  const filteredContacts = contacts.filter(contact => 
    userType === "doctor" ? contact.role === "patient" : contact.role === "doctor"
  );

  const searchedContacts = filteredContacts.filter(contact => 
    contact.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    if (searchedContacts.length > 0 && !selectedContact) {
      setSelectedContact(searchedContacts[0].id);
    }
  }, [searchedContacts, selectedContact]);

  const currentMessages = selectedContact && allMessages[selectedContact] 
    ? allMessages[selectedContact] 
    : [];

  const selectedContactData = contacts.find(c => c.id === selectedContact);
  const otherUser = selectedContactData?.name || "";

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedContact || !currentUserId) return;
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error("Authentication required");
        return;
      }
      
      // Send message to API using userId
      const response = await fetch(`${API_URL}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          receiverId: selectedContact, // This is now correctly userId
          content: newMessage
        })
      });
      
      if (response.ok) {
        const messageData = await response.json();
        
        const message: Message = {
          id: messageData.id || `msg-${Math.random().toString(36).substr(2, 9)}`,
          sender: currentUser,
          recipient: otherUser,
          content: newMessage,
          timestamp: new Date(),
          read: false
        };
        
        setAllMessages(prev => ({
          ...prev,
          [selectedContact]: [...(prev[selectedContact] || []), message]
        }));
        
        setNewMessage("");
        toast.success("Message sent");
      } else {
        toast.error("Failed to send message");
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error("Failed to send message");
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 h-[600px] border rounded-lg overflow-hidden">
      <div className="border-r bg-white">
        <div className="p-3 border-b">
          <div className="flex flex-col gap-2">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder={`Search ${userType === 'doctor' ? 'patients' : 'doctors'}...`} 
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            {userType === 'patient' && (
              <Button 
                size="sm" 
                className="w-full bg-hospital-blue hover:bg-blue-700"
                onClick={() => setShowNewChatDialog(true)}
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                New Chat with Doctor
              </Button>
            )}
          </div>
        </div>
        {loading ? (
          <div className="flex items-center justify-center h-[calc(600px-100px)]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-hospital-blue"></div>
          </div>
        ) : (
          <ScrollArea className="h-[calc(600px-100px)]">
            <div className="space-y-1 p-2">
              {searchedContacts.map((contact) => (
                <button
                  key={contact.id}
                  className={`w-full flex items-center gap-3 p-2 rounded-md transition-colors ${
                    selectedContact === contact.id 
                      ? 'bg-blue-100 text-blue-800' 
                      : 'hover:bg-gray-100'
                  }`}
                  onClick={() => handleContactSelect(contact.id)}
                >
                  <Avatar>
                    <AvatarFallback>{getInitials(contact.name)}</AvatarFallback>
                  </Avatar>
                  <div className="text-left">
                    <p className="font-medium">{contact.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {contact.role === "doctor" && contact.specialization 
                        ? `${contact.specialization} ${chatExists(contact.id) ? '• Active Chat' : '• Start Chat'}`
                        : `${contact.role} ${chatExists(contact.id) ? '• Active Chat' : '• Start Chat'}`}
                    </p>
                  </div>
                </button>
              ))}
              {searchedContacts.length === 0 && (
                <p className="text-center py-4 text-muted-foreground">
                  {userType === 'patient' 
                    ? "No doctors found. Start a new chat with a doctor using the button above." 
                    : "No patients found."}
                </p>
              )}
            </div>
          </ScrollArea>
        )}
        
        {/* New Chat Dialog */}
        <Dialog open={showNewChatDialog} onOpenChange={setShowNewChatDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Start a New Conversation</DialogTitle>
              <DialogDescription>
                Select a doctor to start a new conversation
              </DialogDescription>
            </DialogHeader>
            <div className="max-h-[400px] overflow-y-auto">
              {activeDoctors.length > 0 ? (
                <div className="space-y-2">
                  {activeDoctors.map((doctor) => (
                    <button
                      key={doctor.userId}
                      className="w-full flex items-center gap-3 p-3 rounded-md transition-colors hover:bg-gray-100 border"
                      onClick={() => startNewChatWithDoctor(doctor)}
                    >
                      <Avatar>
                        <AvatarFallback>{getInitials(`${doctor.firstName} ${doctor.lastName}`)}</AvatarFallback>
                      </Avatar>
                      <div className="text-left">
                        <p className="font-medium">Dr. {doctor.firstName} {doctor.lastName}</p>
                        <p className="text-xs text-muted-foreground">{doctor.specialization} • {doctor.hospital}</p>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-center py-4 text-muted-foreground">No active doctors found</p>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
      
      <div className="md:col-span-2 flex flex-col">
        {selectedContact ? (
          <>
            <div className="p-4 border-b bg-white">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarFallback>{selectedContactData ? getInitials(selectedContactData.name) : ""}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-medium">{selectedContactData?.name}</h3>
                  <p className="text-xs text-muted-foreground">
                    {selectedContactData?.role === "doctor" && selectedContactData?.specialization 
                      ? selectedContactData.specialization 
                      : selectedContactData?.role}
                  </p>
                </div>
              </div>
            </div>
            
            <ScrollArea className="flex-1 p-4 bg-gray-50">
              <div className="space-y-4">
                {currentMessages.length > 0 ? (
                  currentMessages.map((message) => {
                    const isCurrentUser = message.sender === currentUser;
                    
                    return (
                      <div 
                        key={message.id} 
                        className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                      >
                        <div 
                          className={`max-w-[80%] p-3 rounded-lg ${
                            isCurrentUser 
                              ? 'bg-hospital-blue text-white rounded-tr-none' 
                              : 'bg-white border rounded-tl-none'
                          }`}
                        >
                          <p className="text-sm">{message.content}</p>
                          <p className={`text-xs mt-1 ${isCurrentUser ? 'text-blue-100' : 'text-muted-foreground'}`}>
                            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-muted-foreground">No messages yet. Start a conversation!</p>
                  </div>
                )}
              </div>
            </ScrollArea>
            
            <div className="p-3 border-t bg-white">
              <form 
                className="flex items-center gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
              >
                <Button 
                  type="button" 
                  size="icon" 
                  variant="ghost"
                  className="h-9 w-9 text-muted-foreground hover:text-black"
                >
                  <Paperclip className="h-5 w-5" />
                </Button>
                <Input 
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1"
                />
                <Button 
                  type="submit" 
                  size="icon" 
                  disabled={!newMessage.trim()}
                  className="h-9 w-9 bg-hospital-blue hover:bg-blue-700"
                >
                  <Send className="h-5 w-5" />
                </Button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">Select a contact to start messaging</p>
          </div>
        )}
      </div>
    </div>
  );
}
