import { useState, useEffect } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const AuthPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const isReset = searchParams.get("reset") === "true";
  const { signIn, signUp, resetPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [fullName, setFullName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [showSetNewPassword, setShowSetNewPassword] = useState(isReset);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [setPasswordError, setSetPasswordError] = useState("");
  const [setPasswordSuccess, setSetPasswordSuccess] = useState("");
  const [checkingUser, setCheckingUser] = useState(false);
  const [userExists, setUserExists] = useState(false);

  // Get the return URL from location state or default to home page
  const from = location.state?.from?.pathname || "/";

  useEffect(() => {
    const checkUser = async () => {
      if (isReset) {
        setCheckingUser(true);
        const { data, error } = await supabase.auth.getUser();
        if (data?.user) {
          setUserExists(true);
        } else {
          setUserExists(false);
        }
        setCheckingUser(false);
      }
    };
    checkUser();
    if (isReset) {
      setShowSetNewPassword(true);
      toast.success("Password reset link clicked", {
        description: "You can now create a new password."
      });
    }
  }, [isReset]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { error } = await signIn(email, password);
      if (error) throw error;
      
      toast.success("Signed in successfully");
      navigate(from, { replace: true });
    } catch (error: any) {
      console.error("Sign in error:", error);
      
      let errorMessage = error.message || "Please check your credentials and try again";
      
      if (error.message === "Email not confirmed") {
        errorMessage = "Please check your email to confirm your registration before logging in.";
      } else if (error.message === "Invalid login credentials") {
        errorMessage = "Invalid email or password. Please try again.";
      }
      
      toast.error("Failed to sign in", {
        description: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!email || !password) {
      toast.error("Missing required fields", {
        description: "Email and password are required.",
      });
      return;
    }
    
    if (password.length < 6) {
      toast.error("Password too short", {
        description: "Password must be at least 6 characters long.",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare user metadata
      const userData = {
        full_name: fullName,
        registration_number: registrationNumber
      };

      const { error, data } = await signUp(email, password, userData);
      
      if (error) throw error;
      
      // Check if email confirmation is required
      if (data?.user?.identities?.length === 0) {
        toast.error("Email already registered", {
          description: "This email is already registered. Please try signing in or use a different email.",
        });
      } else {
        toast.success("Account created successfully", {
          description: "Please check your email to confirm your registration.",
        });
      }
    } catch (error: any) {
      console.error("Sign up error:", error);
      
      let errorMessage = error.message || "Failed to create account. Please try again.";

      // Handle specific error messages
      if (error.message?.includes("unique constraint")) {
        errorMessage = "This email is already registered. Please try signing in.";
      } else if (error.message?.includes("weak password")) {
        errorMessage = "Password is too weak. Please choose a stronger password.";
      }
      
      toast.error("Failed to sign up", {
        description: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      toast.error("Email is required", {
        description: "Please enter your email address.",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Always call resetPassword and show a generic message
      const { error } = await resetPassword(email);
      if (error) throw error;
      setResetSent(true);
      toast.success("If an account with this email exists, a reset link has been sent.", {
        description: "Please check your email for the password reset link.",
      });
    } catch (error: any) {
      toast.error("Failed to send password reset email", {
        description: error.message || "Please check your email and try again",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSetNewPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setSetPasswordError("");
    setSetPasswordSuccess("");
    if (newPassword !== confirmPassword) {
      setSetPasswordError("Passwords do not match.");
      return;
    }
    if (newPassword.length < 6) {
      setSetPasswordError("Password must be at least 6 characters.");
      return;
    }
    setIsSubmitting(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setSetPasswordSuccess("Password updated! You can now log in.");
      setTimeout(() => {
        navigate("/auth");
      }, 2000);
    } catch (error: any) {
      setSetPasswordError(error.message || "Failed to update password. Try again or request a new reset link.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (showSetNewPassword && userExists) {
    if (checkingUser) {
      return (
        <Layout>
          <div className="container mx-auto py-10 flex justify-center">
            <Card className="w-[400px]">
              <CardHeader>
                <CardTitle className="text-2xl">Checking reset link...</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-center">
                <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                <p>Checking your reset link...</p>
              </CardContent>
            </Card>
          </div>
        </Layout>
      );
    }
    if (!userExists) {
      return (
        <Layout>
          <div className="container mx-auto py-10 flex justify-center">
            <Card className="w-[400px]">
              <CardHeader>
                <CardTitle className="text-2xl">Invalid or Expired Link</CardTitle>
                <CardDescription>
                  This reset link is invalid, expired, or the account does not exist.<br />
                  Please request a new reset link or sign up for a new account.
                </CardDescription>
              </CardHeader>
              <CardFooter className="flex flex-col gap-4">
                <Button className="w-full" onClick={() => navigate("/auth")}>Back to Auth</Button>
              </CardFooter>
            </Card>
          </div>
        </Layout>
      );
    }
    return (
      <Layout>
        <div className="container mx-auto py-10 flex justify-center">
          <Card className="w-[400px]">
            <CardHeader>
              <CardTitle className="text-2xl">Set New Password</CardTitle>
              <CardDescription>
                Enter your new password below.
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleSetNewPassword}>
              <CardContent className="space-y-4">
                {setPasswordError && (
                  <Alert className="bg-red-50 text-red-800 border-red-200">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{setPasswordError}</AlertDescription>
                  </Alert>
                )}
                {setPasswordSuccess && (
                  <Alert className="bg-green-50 text-green-800 border-green-200">
                    <CheckCircle2 className="h-4 w-4" />
                    <AlertTitle>Success</AlertTitle>
                    <AlertDescription>{setPasswordSuccess}</AlertDescription>
                  </Alert>
                )}
                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <Input
                    id="new-password"
                    type="password"
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm Password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-4">
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Updating...
                    </>
                  ) : (
                    "Set New Password"
                  )}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={() => navigate("/auth")}
                >
                  Back to Sign In
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      </Layout>
    );
  }

  if (showResetPassword) {
    return (
      <Layout>
        <div className="container mx-auto py-10 flex justify-center">
          <Card className="w-[400px]">
            <CardHeader>
              <CardTitle className="text-2xl">Reset Password</CardTitle>
              <CardDescription>
                Enter your email to receive a password reset link
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleResetPassword}>
              <CardContent className="space-y-4">
                {resetSent && (
                  <Alert className="bg-green-50 text-green-800 border-green-200">
                    <CheckCircle2 className="h-4 w-4" />
                    <AlertTitle>Email Sent</AlertTitle>
                    <AlertDescription>
                      Password reset link sent! Please check your email.
                    </AlertDescription>
                  </Alert>
                )}
                <div className="space-y-2">
                  <Label htmlFor="reset-email">Email</Label>
                  <Input
                    id="reset-email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-4">
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending...
                    </>
                  ) : (
                    "Send Reset Link"
                  )}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={() => setShowResetPassword(false)}
                >
                  Back to Sign In
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto py-10 flex justify-center">
        <Card className="w-[400px]">
          <CardHeader>
            <CardTitle className="text-2xl">Welcome</CardTitle>
            <CardDescription>
              Sign in to your account or create a new one to report lost and found items.
            </CardDescription>
          </CardHeader>
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            <TabsContent value="signin">
              <form onSubmit={handleSignIn}>
                <CardContent className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email">Email</Label>
                    <Input
                      id="signin-email"
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signin-password">Password</Label>
                    <Input
                      id="signin-password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                  <Button 
                    type="button" 
                    variant="link" 
                    className="p-0 h-auto font-normal text-sm"
                    onClick={() => setShowResetPassword(true)}
                  >
                    Forgot password?
                  </Button>
                </CardContent>
                <CardFooter>
                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Signing in...
                      </>
                    ) : (
                      "Sign In"
                    )}
                  </Button>
                </CardFooter>
              </form>
            </TabsContent>
            <TabsContent value="signup">
              <form onSubmit={handleSignUp}>
                <CardContent className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-fullname">Full Name</Label>
                    <Input
                      id="signup-fullname"
                      type="text"
                      placeholder="John Doe"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-registration">Registration Number (Optional)</Label>
                    <Input
                      id="signup-registration"
                      type="text"
                      placeholder="e.g., 12345"
                      value={registrationNumber}
                      onChange={(e) => setRegistrationNumber(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <p className="text-xs text-gray-500">Password must be at least 6 characters long.</p>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating Account...
                      </>
                    ) : (
                      "Create Account"
                    )}
                  </Button>
                </CardFooter>
              </form>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </Layout>
  );
};

export default AuthPage;
