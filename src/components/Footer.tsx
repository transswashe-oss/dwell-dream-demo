import { Home, Facebook, Twitter, Instagram, Linkedin } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-primary text-primary-foreground py-16">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-6">
              <Home className="h-8 w-8" />
              <span className="text-2xl font-bold">DreamHomes</span>
            </div>
            <p className="text-primary-foreground/80 mb-6 max-w-md">
              Your trusted partner in finding the perfect home. We're committed to making your real estate dreams a reality with personalized service and expert guidance.
            </p>
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
              <li><a href="#" className="hover:text-accent transition-colors">Buy Properties</a></li>
              <li><a href="#" className="hover:text-accent transition-colors">Rent Properties</a></li>
              <li><a href="#" className="hover:text-accent transition-colors">Sell Your Home</a></li>
              <li><a href="#" className="hover:text-accent transition-colors">Property Management</a></li>
              <li><a href="#" className="hover:text-accent transition-colors">Market Analysis</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">Company</h3>
            <ul className="space-y-2 text-primary-foreground/80">
              <li><a href="#" className="hover:text-accent transition-colors">About Us</a></li>
              <li><a href="#" className="hover:text-accent transition-colors">Our Team</a></li>
              <li><a href="#" className="hover:text-accent transition-colors">Careers</a></li>
              <li><a href="#" className="hover:text-accent transition-colors">Contact</a></li>
              <li><a href="#" className="hover:text-accent transition-colors">Privacy Policy</a></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-primary-foreground/20 mt-12 pt-8 text-center text-primary-foreground/60">
          <p>&copy; 2024 DreamHomes. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;