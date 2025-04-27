import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react";

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isReset = searchParams.get("reset") === "true";
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [setPasswordError, setSetPasswordError] = useState("");
  const [setPasswordSuccess, setSetPasswordSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkingUser, setCheckingUser] = useState(false);
  const [userExists, setUserExists] = useState(false);

  useEffect(() => {
    const checkUser = async () => {
      if (isReset) {
        setCheckingUser(true);
        const { data } = await supabase.auth.getUser();
        if (data?.user) {
          setUserExists(true);
        } else {
          setUserExists(false);
        }
        setCheckingUser(false);
      }
    };
    checkUser();
  }, [isReset]);

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
};

export default ResetPasswordPage; 