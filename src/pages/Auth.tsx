import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/logo.png";

const Auth = () => {
  const { user, signUp, signIn } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const { error } = await signUp(
      formData.get('email') as string,
      formData.get('password') as string,
      formData.get('name') as string,
      formData.get('phone') as string,
    );
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else toast({ title: "Account created", description: "You can now sign in." });
    setLoading(false);
  };

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const { error } = await signIn(formData.get('email') as string, formData.get('password') as string);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else toast({ title: "Welcome back!", description: "You have been signed in." });
    setLoading(false);
  };

  const handleReset = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setResetLoading(true);
    const email = String(new FormData(e.currentTarget).get("email") || "").trim();
    if (!email) { setResetLoading(false); return; }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setResetLoading(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    toast({
      title: "Check your inbox",
      description: "If an account exists for that email, a reset link is on the way.",
    });
    setResetOpen(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 ocean-gradient">
      <Card className="w-full max-w-md shadow-coastal">
        <CardHeader className="text-center">
          <div className="flex flex-col items-center mb-4">
            <img src={logo} alt="Nyali Shore Real Estate" className="h-20 w-20 object-contain mb-2" />
            <span className="text-2xl font-bold text-primary">Nyali Shore Real Estate</span>
          </div>
          <CardTitle>Welcome</CardTitle>
          <CardDescription>Sign in to your account or create a new one</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email">Email</Label>
                  <Input id="signin-email" name="email" type="email" required placeholder="Enter your email" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="signin-password">Password</Label>
                    <Dialog open={resetOpen} onOpenChange={setResetOpen}>
                      <DialogTrigger asChild>
                        <button type="button" className="text-xs text-primary hover:underline">
                          Forgot password?
                        </button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-sm">
                        <DialogHeader>
                          <DialogTitle>Reset your password</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleReset} className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="reset-email">Email</Label>
                            <Input id="reset-email" name="email" type="email" required placeholder="you@example.com" />
                          </div>
                          <Button type="submit" disabled={resetLoading} className="w-full ocean-gradient">
                            {resetLoading ? "Sending…" : "Send reset link"}
                          </Button>
                          <p className="text-xs text-muted-foreground text-center">
                            We'll email you a secure link to set a new password.
                          </p>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </div>
                  <Input id="signin-password" name="password" type="password" required placeholder="Enter your password" />
                </div>
                <Button type="submit" className="w-full ocean-gradient" disabled={loading}>
                  {loading ? "Signing in…" : "Sign In"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Full Name</Label>
                  <Input id="signup-name" name="name" type="text" required placeholder="Enter your full name" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input id="signup-email" name="email" type="email" required placeholder="Enter your email" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-phone">Phone Number</Label>
                  <Input id="signup-phone" name="phone" type="tel" placeholder="Enter your phone number" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input id="signup-password" name="password" type="password" required placeholder="Create a password" minLength={6} />
                </div>
                <Button type="submit" className="w-full ocean-gradient" disabled={loading}>
                  {loading ? "Creating account…" : "Create Account"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
