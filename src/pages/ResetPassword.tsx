import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import logo from "@/assets/logo.png";

const ResetPassword = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Supabase handles the recovery token from the URL hash and emits PASSWORD_RECOVERY.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(true);
    });
    // Also accept a session that already exists from the magic link.
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.currentTarget);
    const password = String(form.get("password") || "");
    const confirm = String(form.get("confirm") || "");
    if (password.length < 6) {
      toast({ title: "Password too short", description: "Use at least 6 characters.", variant: "destructive" });
      setLoading(false);
      return;
    }
    if (password !== confirm) {
      toast({ title: "Passwords don't match", variant: "destructive" });
      setLoading(false);
      return;
    }
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      toast({ title: "Could not update password", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Password updated", description: "You're now signed in with your new password." });
    navigate("/");
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 ocean-gradient">
      <Card className="w-full max-w-md shadow-coastal">
        <CardHeader className="text-center">
          <div className="flex flex-col items-center mb-4">
            <img src={logo} alt="Nyali Shore Real Estate" className="h-20 w-20 object-contain mb-2" />
            <span className="text-2xl font-bold text-primary">Nyali Shore Real Estate</span>
          </div>
          <CardTitle>Set a new password</CardTitle>
          <CardDescription>
            {ready
              ? "Enter your new password below."
              : "Verifying your reset link…"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {ready ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">New Password</Label>
                <Input id="password" name="password" type="password" minLength={6} required placeholder="At least 6 characters" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm">Confirm Password</Label>
                <Input id="confirm" name="confirm" type="password" minLength={6} required />
              </div>
              <Button type="submit" disabled={loading} className="w-full ocean-gradient">
                {loading ? "Updating…" : "Update Password"}
              </Button>
            </form>
          ) : (
            <p className="text-center text-sm text-muted-foreground">
              If this page doesn't unlock in a few seconds, please request a new reset link from the sign-in page.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPassword;
