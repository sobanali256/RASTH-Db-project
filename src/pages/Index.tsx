import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Hospital, Calendar, MessageSquare, FileText, Lock, User, Users, Clock } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { NavBar } from "@/components/layout/NavBar";

const Index = () => {
  return (
    <div className="min-h-screen">
      <NavBar />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-white to-hospital-green-light py-20">
        <div className="container px-4 text-center">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
              Bridging the gap between <span className="text-hospital-blue">patients</span> and <span className="text-hospital-green">care</span>
            </h1>
            <p className="text-xl mb-8 text-gray-700">
              RASTH: A comprehensive healthcare management system that streamlines patient care and administrative tasks.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="bg-hospital-blue hover:bg-blue-700 text-lg"
                onClick={() => window.location.href = '/login'}
              >
                Get Started
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="text-lg"
                onClick={() => {
                  // Smooth scroll to features section
                  document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                Learn More
              </Button>
            </div>
          </div>
        </div>
      </section>
      
      {/* Features Section */}
      <section id="features" className="py-20">
        <div className="container px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Key Features</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Everything you need to manage healthcare efficiently in one place
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card>
              <CardHeader className="text-center">
                <Calendar className="w-12 h-12 text-hospital-blue mx-auto mb-2" />
                <CardTitle>Appointment Management</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-center text-gray-600">
                  Schedule, reschedule or cancel appointments with ease. Automated reminders for both patients and doctors.
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="text-center">
                <FileText className="w-12 h-12 text-hospital-blue mx-auto mb-2" />
                <CardTitle>Electronic Health Records</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-center text-gray-600">
                  Comprehensive and secure access to patient medical history, lab results, and prescriptions.
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="text-center">
                <MessageSquare className="w-12 h-12 text-hospital-blue mx-auto mb-2" />
                <CardTitle>Secure Messaging</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-center text-gray-600">
                  Private communication channel between doctors and patients for queries, updates, and follow-ups.
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="text-center">
                <Lock className="w-12 h-12 text-hospital-blue mx-auto mb-2" />
                <CardTitle>Privacy & Security</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-center text-gray-600">
                  Advanced encryption and data protection measures to ensure patient information remains confidential.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
      
      {/* How It Works Section */}
      <section className="py-20 bg-gray-50">
        <div className="container px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">How It Works</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Simple, intuitive, and designed for both patients and healthcare providers
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="flex flex-col items-center text-center">
              <div className="bg-hospital-blue text-white rounded-full w-14 h-14 flex items-center justify-center mb-4">
                <User className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-semibold mb-4">For Patients</h3>
              <ul className="space-y-4 text-left">
                <li className="flex items-start gap-2">
                  <span className="bg-green-100 text-green-800 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mt-0.5">1</span>
                  <span>Create an account and fill your medical profile</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="bg-green-100 text-green-800 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mt-0.5">2</span>
                  <span>Book appointments with your preferred doctors</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="bg-green-100 text-green-800 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mt-0.5">3</span>
                  <span>Access your medical records, prescriptions, and test results</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="bg-green-100 text-green-800 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mt-0.5">4</span>
                  <span>Communicate securely with your healthcare providers</span>
                </li>
              </ul>
            </div>
            
            <div className="flex flex-col items-center text-center">
              <div className="bg-hospital-green text-white rounded-full w-14 h-14 flex items-center justify-center mb-4">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-semibold mb-4">For Doctors</h3>
              <ul className="space-y-4 text-left">
                <li className="flex items-start gap-2">
                  <span className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mt-0.5">1</span>
                  <span>Register your practice with credentials and specialties</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mt-0.5">2</span>
                  <span>Manage your schedule and patient appointments</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mt-0.5">3</span>
                  <span>Access and update electronic health records</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mt-0.5">4</span>
                  <span>Prescribe medications and communicate with patients</span>
                </li>
              </ul>
            </div>
            
            <div className="flex flex-col items-center text-center">
              <div className="bg-gray-700 text-white rounded-full w-14 h-14 flex items-center justify-center mb-4">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-semibold mb-4">For Administrators</h3>
              <ul className="space-y-4 text-left">
                <li className="flex items-start gap-2">
                  <span className="bg-gray-200 text-gray-800 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mt-0.5">1</span>
                  <span>Oversee the entire hospital management system</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="bg-gray-200 text-gray-800 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mt-0.5">2</span>
                  <span>Manage user accounts, roles, and permissions</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="bg-gray-200 text-gray-800 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mt-0.5">3</span>
                  <span>Track resources, inventory, and lab test orders</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="bg-gray-200 text-gray-800 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mt-0.5">4</span>
                  <span>Generate reports and analytics on system usage</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-20 bg-hospital-green text-white">
        <div className="container px-4 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold mb-6">Ready to transform healthcare management?</h2>
            <p className="text-xl mb-8 text-green-100">
              Join RASTH today and experience seamless healthcare coordination.
            </p>
            <Link to="/login">
              <Button 
                size="lg" 
                variant="secondary" 
                className="text-hospital-green text-lg"
              >
                Get Started Now
              </Button>
            </Link>
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="py-12 bg-gray-900 text-gray-300">
        <div className="container px-4">
          <div className="flex flex-col md:flex-row justify-between items-center mb-8">
            <div className="flex items-center gap-2 mb-4 md:mb-0">
              <Hospital className="h-6 w-6 text-hospital-green" />
              <span className="text-xl font-bold text-white">RASTH</span>
            </div>
            <div className="flex gap-6">
              <Link to="#" className="hover:text-white transition-colors">About</Link>
              <Link to="#" className="hover:text-white transition-colors">Features</Link>
              <Link to="#" className="hover:text-white transition-colors">Pricing</Link>
              <Link to="#" className="hover:text-white transition-colors">Contact</Link>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center">
            <p>&copy; 2025 RASTH. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
