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
          
          // Removed the auto-selection logic that was here
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
  
  // Removed the useEffect that auto-selected a contact when searchedContacts changed
  
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
    <div className="grid grid-cols-1 md:grid-cols-4 h-full w-full border rounded-xl shadow-lg overflow-hidden bg-gradient-to-br from-blue-50 to-white">
      {/* Contacts Sidebar */}
      <div className="border-r bg-white/90 backdrop-blur-sm overflow-y-auto">
        <div className="p-4 border-b bg-gradient-to-r from-blue-50 to-white">
          <div className="flex flex-col gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-blue-500" />
              <Input 
                placeholder={`Search ${userType === 'doctor' ? 'patients' : 'doctors'}...`} 
                className="pl-10 py-6 rounded-xl border-blue-100 focus:border-blue-300 focus:ring-2 focus:ring-blue-200 transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            {userType === 'patient' && (
              <Button 
                size="sm" 
                className="w-full py-5 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-md hover:shadow-lg transition-all duration-300 font-medium"
                onClick={() => setShowNewChatDialog(true)}
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                New Chat with Doctor
              </Button>
            )}
          </div>
        </div>
        {loading ? (
          <div className="flex flex-col items-center justify-center h-[calc(700px-100px)] gap-3">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-200 border-t-blue-500"></div>
            <p className="text-blue-500 animate-pulse">Loading conversations...</p>
          </div>
        ) : (
          <ScrollArea className="h-[calc(100vh-250px)]">
            <div className="space-y-2 p-3">
              {searchedContacts.map((contact) => (
                <button
                  key={contact.id}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 ${
                    selectedContact === contact.id 
                      ? 'bg-gradient-to-r from-blue-100 to-blue-50 text-blue-800 shadow-md border-l-4 border-blue-500' 
                      : 'hover:bg-blue-50 border border-transparent hover:border-blue-100'
                  }`}
                  onClick={() => handleContactSelect(contact.id)}
                >
                  <Avatar className={`h-12 w-12 border-2 ${selectedContact === contact.id ? 'border-blue-500' : 'border-gray-200'}`}>
                    <AvatarFallback className={`${selectedContact === contact.id ? 'bg-blue-500 text-white' : 'bg-blue-100 text-blue-700'}`}>
                      {getInitials(contact.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-left overflow-hidden">
                    <p className="font-medium truncate">{contact.name}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      {contact.role === "doctor" && contact.specialization 
                        ? (
                          <>
                            <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-1"></span>
                            {contact.specialization}
                            <span className="mx-1">•</span>
                            <span className="text-blue-500">
                              {chatExists(contact.id) ? 'Active Chat' : 'Start Chat'}
                            </span>
                          </>
                        )
                        : (
                          <>
                            <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-1"></span>
                            {contact.role}
                            <span className="mx-1">•</span>
                            <span className="text-blue-500">
                              {chatExists(contact.id) ? 'Active Chat' : 'Start Chat'}
                            </span>
                          </>
                        )}
                    </p>
                  </div>
                </button>
              ))}
              {searchedContacts.length === 0 && (
                <div className="text-center py-8 px-4">
                  <div className="bg-blue-50 rounded-xl p-6 shadow-inner">
                    <MessageSquare className="h-12 w-12 mx-auto mb-3 text-blue-300" />
                    <p className="text-blue-800 font-medium mb-2">
                      {userType === 'patient' 
                        ? "No doctors found" 
                        : "No patients found"}
                    </p>
                    <p className="text-sm text-blue-600">
                      {userType === 'patient' 
                        ? "Start a new chat with a doctor using the button above." 
                        : "Your patient list appears to be empty."}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        )}
        
        {/* New Chat Dialog */}
        <Dialog open={showNewChatDialog} onOpenChange={setShowNewChatDialog}>
          <DialogContent className="max-w-md rounded-xl">
            <DialogHeader>
              <DialogTitle className="text-xl text-blue-800">Start a New Conversation</DialogTitle>
              <DialogDescription className="text-blue-600">
                Select a doctor to start a new conversation
              </DialogDescription>
            </DialogHeader>
            <div className="max-h-[400px] overflow-y-auto pr-2">
              {activeDoctors.length > 0 ? (
                <div className="space-y-3">
                  {activeDoctors.map((doctor) => (
                    <button
                      key={doctor.userId}
                      className="w-full flex items-center gap-3 p-4 rounded-xl transition-all duration-200 hover:bg-blue-50 border border-blue-100 hover:border-blue-300 hover:shadow-md"
                      onClick={() => startNewChatWithDoctor(doctor)}
                    >
                      <Avatar className="h-14 w-14 border-2 border-blue-200">
                        <AvatarFallback className="bg-blue-100 text-blue-700">
                          {getInitials(`${doctor.firstName} ${doctor.lastName}`)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="text-left">
                        <p className="font-medium text-blue-900">Dr. {doctor.firstName} {doctor.lastName}</p>
                        <div className="flex items-center text-xs text-blue-600 mt-1">
                          <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-1"></span>
                          {doctor.specialization} 
                          <span className="mx-1">•</span> 
                          {doctor.hospital}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 px-4">
                  <div className="bg-blue-50 rounded-xl p-6">
                    <MessageSquare className="h-12 w-12 mx-auto mb-3 text-blue-300" />
                    <p className="text-blue-800 font-medium">No active doctors found</p>
                    <p className="text-sm text-blue-600 mt-2">Please try again later</p>
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
      
      {/* Chat Area */}
      <div className="md:col-span-3 flex flex-col bg-gradient-to-br from-white to-blue-50 overflow-hidden">
        {selectedContact ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b bg-white shadow-sm">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12 border-2 border-blue-200">
                  <AvatarFallback className="bg-blue-100 text-blue-700">
                    {selectedContactData ? getInitials(selectedContactData.name) : ""}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-medium text-blue-900">{selectedContactData?.name}</h3>
                  <div className="flex items-center text-xs text-blue-600">
                    <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-1"></span>
                    {selectedContactData?.role === "doctor" && selectedContactData?.specialization 
                      ? selectedContactData.specialization 
                      : selectedContactData?.role}
                    <span className="ml-1">• Online</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Messages Area */}
            <ScrollArea className="flex-1 p-6 bg-gradient-to-br from-blue-50/50 to-white/50 overflow-y-auto max-h-[calc(100vh-250px)]">
              <div className="space-y-6 max-w-3xl mx-auto">
                {currentMessages.length > 0 ? (
                  currentMessages.map((message, index) => {
                    const isCurrentUser = message.sender === currentUser;
                    const showAvatar = index === 0 || 
                      (currentMessages[index-1] && currentMessages[index-1].sender !== message.sender);
                    
                    return (
                      <div 
                        key={message.id} 
                        className={`flex items-end gap-2 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                      >
                        {!isCurrentUser && showAvatar && (
                          <Avatar className="h-8 w-8 mb-1">
                            <AvatarFallback className="bg-blue-100 text-blue-700 text-xs">
                              {getInitials(message.sender)}
                            </AvatarFallback>
                          </Avatar>
                        )}
                        
                        <div 
                          className={`max-w-[75%] p-4 rounded-2xl shadow-sm ${
                            isCurrentUser 
                              ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-br-none' 
                              : 'bg-white border border-blue-100 rounded-bl-none'
                          }`}
                        >
                          <p className="text-sm leading-relaxed">{message.content}</p>
                          <p className={`text-xs mt-1.5 ${isCurrentUser ? 'text-blue-100' : 'text-blue-400'}`}>
                            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        
                        {isCurrentUser && showAvatar && (
                          <Avatar className="h-8 w-8 mb-1">
                            <AvatarFallback className="bg-blue-500 text-white text-xs">
                              {getInitials(currentUser)}
                            </AvatarFallback>
                          </Avatar>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="flex flex-col items-center justify-center h-[400px] text-center">
                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-blue-100 max-w-md">
                      <MessageSquare className="h-16 w-16 mx-auto mb-4 text-blue-200" />
                      <h3 className="text-xl font-medium text-blue-900 mb-2">No messages yet</h3>
                      <p className="text-blue-600">Send a message to start the conversation with {selectedContactData?.name}!</p>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
            
            {/* Message Input */}
            <div className="p-4 border-t bg-white">
              <form 
                className="flex items-center gap-3 bg-blue-50 p-2 rounded-xl border border-blue-100"
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
              >
                <Button 
                  type="button" 
                  size="icon" 
                  variant="ghost"
                  className="h-10 w-10 rounded-full text-blue-500 hover:text-blue-700 hover:bg-blue-100"
                >
                  <Paperclip className="h-5 w-5" />
                </Button>
                <Input 
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 border-0 bg-transparent focus:ring-0 placeholder:text-blue-300"
                />
                <Button 
                  type="submit" 
                  size="icon" 
                  disabled={!newMessage.trim()}
                  className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-sm"
                >
                  <Send className="h-5 w-5" />
                </Button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full p-6">
            <div className="text-center max-w-md bg-white p-8 rounded-2xl shadow-sm border border-blue-100">
              <MessageSquare className="h-20 w-20 mx-auto mb-6 text-blue-200" />
              <h2 className="text-2xl font-medium text-blue-900 mb-3">Welcome to Messages</h2>
              <p className="text-blue-600 mb-6">
                {searchedContacts.length > 0 
                  ? "Select a contact from the sidebar to start messaging." 
                  : userType === 'patient' 
                    ? "No recent conversations found. Start a new chat with a doctor." 
                    : "No patient conversations found. Patients can initiate conversations with you."}
              </p>
              {userType === 'patient' && (
                <Button 
                  className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 rounded-xl py-6 px-8 shadow-md"
                  onClick={() => setShowNewChatDialog(true)}
                >
                  <MessageSquare className="h-5 w-5 mr-2" />
                  Start a New Conversation
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}