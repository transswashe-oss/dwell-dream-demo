import { Facebook, Twitter, Instagram, Linkedin, Mail, Phone } from "lucide-react";
import { Link } from "react-router-dom";
import logo from "@/assets/logo.png";

const Footer = () => {
  return (
    <footer className="bg-primary text-primary-foreground py-16">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-3 mb-6">
              <div className="bg-white rounded-full p-1">
                <img src={logo} alt="Nyali Shore Real Estate logo" className="h-12 w-12 object-contain" />
              </div>
              <span className="text-2xl font-bold">Nyali Shore Real Estate</span>
            </div>
            <p className="text-primary-foreground/80 mb-6 max-w-md">
              Your trusted coastal Airbnb partner in Mombasa. Hand-picked stays along Nyali shore with verified hosts, sea views, and modern comforts.
            </p>
            <div className="space-y-2 mb-6">
              <a href="mailto:omaryw003@gmail.com" className="flex items-center gap-2 text-primary-foreground/80 hover:text-accent transition-colors">
                <Mail className="h-4 w-4" /> omaryw003@gmail.com
              </a>
              <a href="tel:+254725409996" className="flex items-center gap-2 text-primary-foreground/80 hover:text-accent transition-colors">
                <Phone className="h-4 w-4" /> +254 725 409 996
              </a>
            </div>
            <div className="flex space-x-4">
              <Facebook className="h-6 w-6 hover:text-accent cursor-pointer transition-colors" />
              <Twitter className="h-6 w-6 hover:text-accent cursor-pointer transition-colors" />
              <Instagram className="h-6 w-6 hover:text-accent cursor-pointer transition-colors" />
              <Linkedin className="h-6 w-6 hover:text-accent cursor-pointer transition-colors" />
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-primary-foreground/80">
              <li><Link to="/" className="hover:text-accent transition-colors">Home</Link></li>
              <li><Link to="/apartments" className="hover:text-accent transition-colors">Apartments</Link></li>
              <li><Link to="/about" className="hover:text-accent transition-colors">About Us</Link></li>
              <li><Link to="/my-bookings" className="hover:text-accent transition-colors">My Bookings</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">Company</h3>
            <ul className="space-y-2 text-primary-foreground/80">
              <li><Link to="/about" className="hover:text-accent transition-colors">About Us</Link></li>
              <li><Link to="/auth" className="hover:text-accent transition-colors">Sign In</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-primary-foreground/20 mt-12 pt-8 text-center text-primary-foreground/60">
          <p>&copy; {new Date().getFullYear()} Nyali Shore Real Estate. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
