import { Button } from "@/components/ui/button";
import { LogOut, User, Settings } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import logo from "@/assets/logo.png";
import { ThemeToggle, FontPicker } from "@/components/ThemeFontToggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Navigation = () => {
  const { user, isAdmin, signOut } = useAuth();
  const location = useLocation();

  const handleSignOut = async () => {
    await signOut();
  };

  const navItems = [
    { href: "/", label: "Home" },
    { href: "/about", label: "About" },
    { href: "/apartments", label: "Apartments" },
  ];

  return (
    <nav className="bg-card/95 backdrop-blur-sm border-b border-border sticky top-0 z-50 shadow-coastal">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-3">
            <img src={logo} alt="Nyali Shore Real Estate logo" className="h-12 w-12 object-contain" />
            <span className="text-xl md:text-2xl font-bold ocean-gradient bg-clip-text text-transparent leading-tight">
              Nyali Shore<br className="md:hidden" /><span className="hidden md:inline"> </span>Real Estate
            </span>
          </Link>
          
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className={`text-foreground hover:text-primary transition-colors font-medium ${
                  location.pathname === item.href ? "text-primary" : ""
                }`}
              >
                {item.label}
              </Link>
            ))}
            {isAdmin && (
              <Link
                to="/admin"
                className={`text-accent hover:text-accent/80 transition-colors font-medium ${
                  location.pathname.includes("/admin") ? "text-accent" : ""
                }`}
              >
                Admin Panel
              </Link>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <FontPicker />
            <ThemeToggle />
            {user ? (
              <>
                <Link to="/my-bookings">
                  <Button variant="outline" className="hidden sm:flex">
                    My Bookings
                  </Button>
                </Link>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <User className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem asChild>
                      <Link to="/profile" className="flex items-center">
                        <Settings className="mr-2 h-4 w-4" />
                        Profile
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/my-bookings" className="flex items-center sm:hidden">
                        <User className="mr-2 h-4 w-4" />
                        My Bookings
                      </Link>
                    </DropdownMenuItem>
                    {isAdmin && (
                      <DropdownMenuItem asChild>
                        <Link to="/admin" className="flex items-center">
                          <Settings className="mr-2 h-4 w-4" />
                          Admin Panel
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut}>
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <Link to="/auth">
                <Button className="ocean-gradient">
                  Sign In
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
