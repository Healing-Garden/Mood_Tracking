import { Button } from "../../components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { Heart, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [step, setStep] = useState<"email" | "otp" | "reset">("email");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleEmailSubmit = () => {
    if (email) {
      setStep("otp");
    }
  };

  const handleOtpSubmit = () => {
    if (otp.length === 6) {
      setStep("reset");
    }
  };

  const handlePasswordReset = () => {
    if (newPassword === confirmPassword && newPassword.length >= 8) {
      // TODO: Gọi API reset password ở đây
      console.log("Password reset successful");
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/5 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <Link to="/login">
          <Button
            variant="ghost"
            className="mb-8 -ml-4 text-foreground/70 hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Login
          </Button>
        </Link>

        <Card className="border border-border/40 bg-card/60 backdrop-blur">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <Heart className="w-7 h-7 text-primary-foreground" />
              </div>
            </div>
            <CardTitle className="text-2xl text-foreground">Reset Password</CardTitle>
            <CardDescription className="text-foreground/60">
              {step === "email" && "Enter your email to receive a verification code"}
              {step === "otp" && "Enter the 6-digit code sent to your email"}
              {step === "reset" && "Create your new password"}
            </CardDescription>
          </CardHeader>

          <CardContent>
            {/* Step 1: Email */}
            {step === "email" && (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Email Address
                  </label>
                  <Input
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-background border-border/60 text-foreground placeholder:text-foreground/50 rounded-lg"
                  />
                </div>
                <Button
                  onClick={handleEmailSubmit}
                  disabled={!email.trim()}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg disabled:opacity-50"
                >
                  Send Verification Code
                </Button>
              </div>
            )}

            {/* Step 2: OTP */}
            {step === "otp" && (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Verification Code
                  </label>
                  <Input
                    type="text"
                    placeholder="000000"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                    className="bg-background border-border/60 text-foreground placeholder:text-foreground/50 rounded-lg text-center text-2xl tracking-widest font-mono"
                  />
                  <p className="text-xs text-foreground/60 mt-2">
                    Didn't receive a code?{" "}
                    <button
                      onClick={() => setStep("email")}
                      className="text-primary hover:underline"
                    >
                      Resend
                    </button>
                  </p>
                </div>
                <Button
                  onClick={handleOtpSubmit}
                  disabled={otp.length !== 6}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg disabled:opacity-50"
                >
                  Verify Code
                </Button>
              </div>
            )}

            {/* Step 3: Reset Password */}
            {step === "reset" && (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    New Password
                  </label>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="bg-background border-border/60 text-foreground placeholder:text-foreground/50 rounded-lg"
                  />
                  <p className="text-xs text-foreground/60 mt-1">Minimum 8 characters</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Confirm Password
                  </label>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="bg-background border-border/60 text-foreground placeholder:text-foreground/50 rounded-lg"
                  />
                </div>

                {newPassword !== confirmPassword && newPassword.length > 0 && (
                  <p className="text-sm text-destructive">Passwords do not match</p>
                )}

                <Button
                  onClick={handlePasswordReset}
                  disabled={
                    newPassword !== confirmPassword || newPassword.length < 8
                  }
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg disabled:opacity-50"
                >
                  Reset Password
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}