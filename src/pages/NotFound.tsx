import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen page-bg flex items-center justify-center px-4">
      <div className="text-center bg-card/90 backdrop-blur-md p-10 rounded-2xl shadow-coastal max-w-md">
        <h1 className="text-7xl font-bold text-primary mb-4">404</h1>
        <p className="text-xl text-foreground mb-2 font-semibold">Page not found</p>
        <p className="text-muted-foreground mb-6">
          The page you're looking for has drifted out to sea.
        </p>
        <Button asChild className="ocean-gradient">
          <Link to="/"><Home className="h-4 w-4 mr-2" />Return Home</Link>
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
