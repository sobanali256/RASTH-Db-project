import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  Hospital, 
  LogOut, 
  User,
  Menu,
  X,
  UserCog,
  Shield,
  Star
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { toast } from "sonner";

export function NavBar() {
  const [userType, setUserType] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const storedUserType = localStorage.getItem("userType");
    const authStatus = localStorage.getItem("isAuthenticated") === "true";
    
    setUserType(storedUserType);
    setIsAuthenticated(authStatus);
  }, [location.pathname]);

  const handleLogout = () => {
    localStorage.removeItem("userType");
    localStorage.removeItem("isAuthenticated");
    setUserType(null);
    setIsAuthenticated(false);
    toast.success("Logged out successfully");
    navigate("/");
  };

  const getDisplayName = () => {
    const firstName = localStorage.getItem('firstName') || '';
    const lastName = localStorage.getItem('lastName') || '';
    
    if (userType === "doctor") return `Dr. ${firstName} ${lastName}`;
    if (userType === "patient") return `${firstName} ${lastName}`;
    if (userType === "admin") return "Admin User";
    return "";
  };

  const getLinks = () => {
    const userId = localStorage.getItem('userId');
    
    if (userType === "doctor") {
      return [
        { name: "Dashboard", path: `/dashboard/doctor/${userId}` },
        { name: "Appointments", path: `/doctor-appointments` },
        { name: "Patients", path: "/doctor-patients" },
        { name: "Messages", path: "/messages" },
        { name: "My Ratings", path: "/doctor-ratings" }
      ];
    } else if (userType === "patient") {
      return [
        { name: "Dashboard", path: `/dashboard/patient/${userId}` },
        { name: "Appointments", path: "/patient-appointments" },
        { name: "Records", path: "/patient-records" },
        { name: "Messages", path: "/messages" },
        { name: "Rate Doctors", path: "/patient-ratings" }
      ];
    } else if (userType === "admin") {
      return [
        { name: "Dashboard", path: "/admin-dashboard" },
        { name: "Messages", path: "/messages" }
      ];
    }
    return [];
  };

  const links = getLinks();

  const renderLinks = () => (
    <div className={isMobile ? "flex flex-col space-y-4" : "flex items-center space-x-4"}>
      {links.map((link) => (
        <Link
          key={link.path}
          to={link.path}
          className={`${
            location.pathname === link.path
              ? "font-medium text-hospital-blue"
              : "text-gray-600 hover:text-hospital-blue"
          } transition-colors`}
          onClick={() => isMobile && setIsOpen(false)}
        >
          {link.name}
        </Link>
      ))}
    </div>
  );

  const getUserIcon = () => {
    if (userType === "doctor") return <UserCog className="h-4 w-4 text-hospital-blue" />;
    if (userType === "admin") return <Shield className="h-4 w-4 text-hospital-blue" />;
    return <User className="h-4 w-4 text-hospital-blue" />;
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white">
      <div className="container flex h-16 items-center justify-between px-4 md:px-6">
        <Link to="/" className="flex items-center gap-2">
          <Hospital className="h-6 w-6 text-hospital-green" />
          <span className="text-xl font-bold">RASTH</span>
        </Link>

        {isAuthenticated ? (
          <>
            {isMobile ? (
              <Sheet open={isOpen} onOpenChange={setIsOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon">
                    {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[250px] sm:w-[300px]">
                  <div className="flex flex-col h-full">
                    <div className="py-4 border-b">
                      <div className="flex items-center gap-2 mb-2">
                        {getUserIcon()}
                        <span className="font-medium">{getDisplayName()}</span>
                      </div>
                      <p className="text-sm text-muted-foreground capitalize">
                        {userType}
                      </p>
                    </div>
                    <nav className="flex-1 py-8">
                      {renderLinks()}
                    </nav>
                    <div className="py-4 border-t">
                      <Button 
                        variant="ghost" 
                        className="w-full justify-start text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={handleLogout}
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        Logout
                      </Button>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            ) : (
              <div className="flex items-center gap-6">
                <nav className="hidden md:flex">
                  {renderLinks()}
                </nav>
                <div className="border-l h-8 mx-2"></div>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="ghost" 
                    className="text-sm"
                    onClick={handleLogout}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </Button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              className="text-sm"
              onClick={() => navigate("/login")}
            >
              Login
            </Button>
            <Button 
              className="bg-hospital-blue hover:bg-blue-700"
              onClick={() => navigate("/login")}
            >
              Get Started
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}
