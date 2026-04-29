import { Facebook, Twitter, Instagram, Linkedin, Mail, Phone, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import logo from "@/assets/logo.png";
import { useSiteSettings } from "@/hooks/useSiteSettings";

const Footer = () => {
  const { settings: s } = useSiteSettings();
  const socials = [
    { url: s.facebook_url, Icon: Facebook, label: "Facebook" },
    { url: s.twitter_url, Icon: Twitter, label: "Twitter" },
    { url: s.instagram_url, Icon: Instagram, label: "Instagram" },
    { url: s.linkedin_url, Icon: Linkedin, label: "LinkedIn" },
  ].filter((x) => !!x.url);

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
            <p className="text-primary-foreground/80 mb-6 max-w-md">{s.footer_text}</p>
            <div className="space-y-2 mb-6">
              <a href={`mailto:${s.contact_email}`} className="flex items-center gap-2 text-primary-foreground/80 hover:text-accent transition-colors">
                <Mail className="h-4 w-4" /> {s.contact_email}
              </a>
              <a href={`tel:${s.contact_phone.replace(/\s/g, "")}`} className="flex items-center gap-2 text-primary-foreground/80 hover:text-accent transition-colors">
                <Phone className="h-4 w-4" /> {s.contact_phone}
              </a>
              <div className="flex items-center gap-2 text-primary-foreground/80">
                <MapPin className="h-4 w-4" /> {s.contact_address}
              </div>
            </div>
            {socials.length > 0 && (
              <div className="flex space-x-4">
                {socials.map(({ url, Icon, label }) => (
                  <a key={label} href={url} target="_blank" rel="noopener noreferrer" aria-label={label}>
                    <Icon className="h-6 w-6 hover:text-accent transition-colors" />
                  </a>
                ))}
              </div>
            )}
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
            <h3 className="text-lg font-semibold mb-4">Stay Options</h3>
            <ul className="space-y-2 text-primary-foreground/80 text-sm">
              <li>🌊 Short stays (per night)</li>
              <li>🏠 Long-term rentals (per month)</li>
              <li>🔑 Verified hosts</li>
              <li>💳 M-Pesa payments</li>
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
