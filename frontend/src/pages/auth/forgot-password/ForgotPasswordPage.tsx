import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Leaf, Eye, EyeOff } from "lucide-react";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import { Label } from "../../../components/ui/Label";
import { useRef } from "react";
import { authApi } from "../../../api/authApi";

type Step = "email" | "verify" | "reset";

const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState<string[]>(Array(6).fill(""));
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const otpInputsRef = useRef<Array<HTMLInputElement | null>>([]);

  // Password validation
  const passwordChecklist = {
    length: newPassword.length >= 8,
    upper: /[A-Z]/.test(newPassword),
    number: /\d/.test(newPassword),
    special: /[^A-Za-z0-9]/.test(newPassword),
  };
  const isPasswordValid = Object.values(passwordChecklist).every(Boolean);

  // STEP 1: EMAIL
  const handleEmailSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await authApi.forgotPassword({ email });
      setStep("verify");
    } catch (err) {
      if (err && typeof err === "object" && "response" in err) {
        const axiosErr = err as { response?: { data?: { message?: string } } };
        setError(axiosErr.response?.data?.message || "Failed to send OTP");
      } else {
        setError("Failed to send OTP");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // STEP 2: VERIFY OTP
  const handleVerifyOtp = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    const otpCode = otp.join("");
    if (otpCode.length !== 6) {
      setError("Please enter a valid 6-digit OTP");
      return;
    }
    setIsLoading(true);
    try {
      await authApi.verifyForgotOtp({ email, otp: otpCode });
      setStep("reset");
    } catch (err: unknown) {
      if (
        err &&
        typeof err === "object" &&
        "response" in err &&
        (err as { response?: { data?: { message?: string } } }).response?.data?.message
      ) {
        setError(
          (err as { response?: { data?: { message?: string } } }).response?.data?.message ||
            "OTP invalid or expired"
        );
      } else {
        setError("OTP invalid or expired");
      }
      setOtp(Array(6).fill(""));
      setTimeout(() => {
        const firstInput = document.querySelector(
          "#otp-input-0"
        ) as HTMLInputElement;
        if (firstInput) firstInput.focus();
      }, 100);
    } finally {
      setIsLoading(false);
    }
  };

  // STEP 3: RESET PASSWORD
  const handleResetPassword = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    if (!isPasswordValid) {
      setError(
        "Password must be at least 8 characters, include uppercase letter, number and special character"
      );
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setIsLoading(true);
    try {
      await authApi.resetForgotPassword({ email, newPassword });
      navigate("/login");
    } catch (err) {
      if (err && typeof err === "object" && "response" in err) {
        const axiosErr = err as { response?: { data?: { message?: string } } };
        setError(
          axiosErr.response?.data?.message || "Failed to reset password"
        );
      } else {
        setError("Failed to reset password");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setResendLoading(true);
    setOtp(Array(6).fill(""));
    setError("");
    try {
      await authApi.forgotPassword({ email });
    } catch (err) {
      if (err && typeof err === "object" && "response" in err) {
        const axiosErr = err as { response?: { data?: { message?: string } } };
        setError(axiosErr.response?.data?.message || "Cannot resend OTP");
      } else {
        setError("Cannot resend OTP");
      }
    } finally {
      setResendLoading(false);
      setTimeout(() => {
        const firstInput = document.querySelector(
          "#otp-input-0"
        ) as HTMLInputElement;
        if (firstInput) firstInput.focus();
      }, 100);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/30 flex items-center justify-center px-4 relative overflow-hidden">
      {/* Decorative leaves */}
      <div className="absolute top-10 right-10 opacity-20 animate-pulse">
        <Leaf size={60} className="text-primary" />
      </div>
      <div
        className="absolute bottom-10 left-10 opacity-20 animate-pulse"
        style={{ animationDelay: "1s" }}
      >
        <Leaf size={80} className="text-primary" />
      </div>

      <div className="w-full max-w-md z-10">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <img
            src="/healing-garden-logo.png"
            alt="Healing Garden"
            width={80}
            height={80}
            className="rounded-lg shadow-lg"
          />
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 border border-border">
          {/* STEP EMAIL */}
          {step === "email" && (
            <>
              <h1 className="text-3xl font-bold text-primary mb-2 text-center">
                Reset Password
              </h1>
              <p className="text-center text-muted-foreground mb-8">
                Enter your email address to reset your password
              </p>
              <form onSubmit={handleEmailSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Email Address</Label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}
                <Button disabled={isLoading} className="w-full h-11">
                  {isLoading ? "Sending..." : "Send Recovery Code"}
                </Button>
              </form>
              <div className="mt-6 text-center text-sm">
                Remember your password?{" "}
                <Link to="/login" className="text-primary font-semibold">
                  Sign In
                </Link>
              </div>
            </>
          )}

          {/* STEP VERIFY */}
          {step === "verify" && (
            <>
              <h1 className="text-3xl font-bold text-primary text-center mb-2">
                Enter OTP
              </h1>
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div className="flex gap-2 justify-between mb-2">
                  {otp.map((v, i) => (
                    <Input
                      key={i}
                      id={`otp-input-${i}`}
                      maxLength={1}
                      className="w-12 h-12 text-center text-xl"
                      value={v}
                      ref={(el) => {
                        otpInputsRef.current[i] = el;
                      }}
                      onChange={(e) => {
                        const digit = e.target.value.replace(/\D/g, "");
                        if (!digit) return;
                        const next = [...otp];
                        next[i] = digit;
                        setOtp(next);
                        setError("");
                        // Auto focus next
                        if (digit && i < 5) {
                          const nextInput = document.querySelector(
                            `#otp-input-${i + 1}`
                          ) as HTMLInputElement | null;
                          if (nextInput) nextInput.focus();
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Backspace") {
                          if (otp[i]) {
                            const next = [...otp];
                            next[i] = "";
                            setOtp(next);
                          } else if (i > 0) {
                            const prevInput = document.querySelector(
                              `#otp-input-${i - 1}`
                            ) as HTMLInputElement;
                            if (prevInput) prevInput.focus();
                            const next = [...otp];
                            next[i - 1] = "";
                            setOtp(next);
                          }
                        } else if (e.key === "ArrowLeft" && i > 0) {
                          const prevInput = document.querySelector(
                            `#otp-input-${i - 1}`
                          ) as HTMLInputElement;
                          if (prevInput) prevInput.focus();
                        } else if (e.key === "ArrowRight" && i < 5) {
                          const nextInput = document.querySelector(
                            `#otp-input-${i + 1}`
                          ) as HTMLInputElement;
                          if (nextInput) nextInput.focus();
                        }
                      }}
                      onPaste={
                        i === 0
                          ? (e) => {
                              e.preventDefault();
                              const pasted = e.clipboardData
                                .getData("text")
                                .replace(/\D/g, "")
                                .slice(0, 6);
                              setOtp(
                                pasted
                                  .split("")
                                  .concat(Array(6 - pasted.length).fill(""))
                              );
                              setTimeout(() => {
                                const nextInput = document.querySelector(
                                  `#otp-input-${pasted.length}`
                                ) as HTMLInputElement;
                                if (nextInput) nextInput.focus();
                              }, 10);
                            }
                          : undefined
                      }
                      autoFocus={i === 0}
                    />
                  ))}
                </div>
                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}
                <Button disabled={isLoading} className="w-full h-11">
                  {isLoading ? "Verifying..." : "Verify OTP"}
                </Button>
              </form>
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={resendLoading}
                className="w-full text-sm text-primary font-semibold mt-2"
              >
                {resendLoading ? "Resending..." : "Resend OTP"}
              </button>
            </>
          )}

          {/* STEP RESET */}
          {step === "reset" && (
            <>
              <h1 className="text-3xl font-bold text-primary text-center mb-2">
                Set New Password
              </h1>
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="space-y-1">
                  <Label>New Password</Label>
                  <div className="relative">
                    <Input
                      type={showNewPassword ? "text" : "password"}
                      placeholder="New password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword((v) => !v)}
                      className="absolute right-3 top-2.5 text-muted-foreground"
                      tabIndex={-1}
                    >
                      {showNewPassword ? (
                        <EyeOff size={18} />
                      ) : (
                        <Eye size={18} />
                      )}
                    </button>
                  </div>
                  <ul className="text-sm mt-2 space-y-1">
                    <li
                      className={
                        passwordChecklist.length
                          ? "text-green-600"
                          : "text-red-600"
                      }
                    >
                      • At least 8 characters
                    </li>
                    <li
                      className={
                        passwordChecklist.upper
                          ? "text-green-600"
                          : "text-red-600"
                      }
                    >
                      • One uppercase letter
                    </li>
                    <li
                      className={
                        passwordChecklist.number
                          ? "text-green-600"
                          : "text-red-600"
                      }
                    >
                      • One number
                    </li>
                    <li
                      className={
                        passwordChecklist.special
                          ? "text-green-600"
                          : "text-red-600"
                      }
                    >
                      • One special character
                    </li>
                  </ul>
                </div>
                <div className="space-y-1">
                  <Label>Confirm Password</Label>
                  <div className="relative">
                    <Input
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((v) => !v)}
                      className="absolute right-3 top-2.5 text-muted-foreground"
                      tabIndex={-1}
                    >
                      {showConfirmPassword ? (
                        <EyeOff size={18} />
                      ) : (
                        <Eye size={18} />
                      )}
                    </button>
                  </div>
                </div>
                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}
                <Button disabled={isLoading} className="w-full h-11">
                  {isLoading ? "Updating..." : "Update Password"}
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
