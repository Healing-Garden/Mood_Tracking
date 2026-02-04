import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { X, Eye, EyeOff, Leaf } from "lucide-react";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import { Label } from "../../../components/ui/Label";
import { authApi } from "../../../api/authApi";
import { userApi } from "../../../api/userApi";
import { useOnboardingStore } from "../../../store/onboardingStore";
import { useDailyCheckInStore } from "../../../store/dailyCheckInStore";

/* ================== HELPERS ================== */
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const passwordRules = {
  length: (v: string) => v.length >= 8,
  upper: (v: string) => /[A-Z]/.test(v),
  number: (v: string) => /\d/.test(v),
  special: (v: string) => /[^A-Za-z0-9]/.test(v),
};

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();

  /* ================= FORM ================= */
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  /* ================= UI ================= */
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  /* ================= OTP ================= */
  const [otp, setOtp] = useState<string[]>(Array(6).fill(""));
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpError, setOtpError] = useState("");
  const [resendLoading, setResendLoading] = useState(false);

  /* ================= VALIDATION ================= */
  const passwordChecklist = {
    length: passwordRules.length(password),
    upper: passwordRules.upper(password),
    number: passwordRules.number(password),
    special: passwordRules.special(password),
  };

  const isPasswordValid = Object.values(passwordChecklist).every(Boolean);

  /* ================= REGISTER ================= */
  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setEmailError("");
    setPasswordError("");
    setConfirmPasswordError("");

    if (!fullName || !email || !password || !confirmPassword) {
      setError("Please fill all required fields");
      return;
    }

    if (!emailRegex.test(email)) {
      setEmailError("Invalid email format");
      return;
    }

    if (!isPasswordValid) {
      setPasswordError(
        "Password must be at least 8 characters, include uppercase letter, number and special character"
      );
      return;
    }

    if (password !== confirmPassword) {
      setConfirmPasswordError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      await authApi.register({ fullName, email, password });
      setShowOtpModal(true);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Register failed");
    } finally {
      setLoading(false);
    }
  };

  /* ================= VERIFY OTP ================= */
  const { resetOnboarding } = useOnboardingStore();
  const { resetStore: resetDailyStore } = useDailyCheckInStore();

  const handleVerifyOtp = async () => {
    const otpCode = otp.join("");
    if (otpCode.length !== 6) {
      setOtpError("OTP must be 6 digits");
      return;
    }

    setLoading(true);
    try {
      await authApi.verifyRegisterOtp({ email, otp: otpCode });
      const loginRes = await authApi.login({ email, password });
      localStorage.setItem("accessToken", loginRes.accessToken);
      localStorage.setItem("user", JSON.stringify(loginRes.user));

      // Reset persisted stores so they scope to the newly logged-in user
      try {
        resetOnboarding()
      } catch {}
      try {
        resetDailyStore()
      } catch {}

      // Check if user has completed onboarding
      try {
        const statusRes = await userApi.getOnboardingStatus();
        if (statusRes.isOnboarded) {
          navigate("/user/dashboard");
        } else {
          navigate("/onboarding/step-1");
        }
      } catch {
        // If status check fails, default to onboarding
        navigate("/onboarding/step-1");
      }
    } catch (err: any) {
      setOtp(Array(6).fill("")); // Reset OTP input on error
      setOtpError(err?.response?.data?.message || "OTP invalid");
      setTimeout(() => {

        const firstInput = document.querySelector(
          "#otp-input-0"
        ) as HTMLInputElement;
        if (firstInput) firstInput.focus();
      }, 100);
    } finally {
      setLoading(false);
    }
  };

  /* ================= RESEND OTP ================= */
  const handleResendOtp = async () => {
    setResendLoading(true);
    setOtp(Array(6).fill("")); // Reset OTP input on resend
    setOtpError("");
    try {
      await authApi.register({ fullName, email, password });
    } catch {
      setOtpError("Cannot resend OTP");
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/30 flex items-center justify-center px-4 relative overflow-hidden">
      {/* Decorative leaves */}
      <div className="absolute top-10 right-10 opacity-20 animate-pulse pointer-events-none select-none">
        <Leaf size={60} className="text-primary" />
      </div>
      <div
        className="absolute bottom-10 left-10 opacity-20 animate-pulse pointer-events-none select-none"
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
          <h1 className="text-3xl font-bold text-primary mb-2 text-center">
            Create Your Account
          </h1>
          <p className="text-center text-muted-foreground mb-8">
            Start your wellness journey today
          </p>

          <form onSubmit={handleRegister} className="space-y-4">
            {/* Full name */}
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>

            {/* Email */}
            <div className="space-y-1">
              <Label>Email</Label>
              <Input
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setEmailError("");
                }}
              />
              {emailError && (
                <p className="text-sm text-red-600">{emailError}</p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-1">
              <Label>Password</Label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setPasswordError("");
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-muted-foreground"
                  // aria-label={showPassword ? "Hide password" : "Show password"}
                  // title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              <ul className="text-sm mt-2 space-y-1">
                <li
                  className={
                    passwordChecklist.length ? "text-green-600" : "text-red-600"
                  }
                >
                  • At least 8 characters
                </li>
                <li
                  className={
                    passwordChecklist.upper ? "text-green-600" : "text-red-600"
                  }
                >
                  • One uppercase letter
                </li>
                <li
                  className={
                    passwordChecklist.number ? "text-green-600" : "text-red-600"
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

              {passwordError && (
                <p className="text-sm text-red-600">{passwordError}</p>
              )}
            </div>

            {/* Confirm password */}
            <div className="space-y-1">
              <Label>Confirm Password</Label>
              <div className="relative">
                <Input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setConfirmPasswordError("");
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-2.5 text-muted-foreground"
                  // aria-label={
                  //   showConfirmPassword ? "Hide confirm password" : "Show confirm password"
                  // }
                  // title={
                  //   showConfirmPassword ? "Hide confirm password" : "Show confirm password"
                  // }
                >
                  {showConfirmPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>

              {/* ✅ ĐÚNG CHỖ */}
              {confirmPasswordError && (
                <p className="text-sm text-red-600">{confirmPasswordError}</p>
              )}
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <Button className="w-full h-11" disabled={loading}>
              {loading ? "Creating Account..." : "Create Account"}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            Already have an account?{" "}
            <Link to="/login" className="text-primary font-semibold">
              Sign In
            </Link>
          </div>
        </div>
      </div>

      {/* ================= OTP MODAL ================= */}
      {showOtpModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white w-full max-w-sm rounded-2xl p-6 relative">
            <button
              // type="button"
              onClick={() => setShowOtpModal(false)}
              className="absolute right-4 top-4 text-gray-400"
              // aria-label="Close dialog"
              // title="Close dialog"
            >
              <X size={20} />
            </button>

            <h2 className="text-xl font-bold text-center mb-4">
              Verify your email
            </h2>

            <div className="flex justify-between gap-2 mb-4">
              {otp.map((v, i) => (
                <Input
                  key={i}
                  maxLength={1}
                  className="w-12 h-12 text-center text-xl"
                  value={v}
                  onChange={(e) => {
                    const digit = e.target.value.replace(/\D/g, "");
                    if (!digit) return;
                    const next = [...otp];
                    next[i] = digit;
                    setOtp(next);
                    setOtpError(""); // Xóa thông báo lỗi khi nhập lại
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
                        // focus next empty input
                        setTimeout(() => {
                          const nextInput = document.querySelector(
                            `#otp-input-${pasted.length}`
                          ) as HTMLInputElement;
                          if (nextInput) nextInput.focus();
                        }, 10);
                      }
                      : undefined
                  }
                  id={`otp-input-${i}`}
                  autoFocus={i === 0 && showOtpModal && otp.every((d) => !d)}
                />
              ))}
            </div>

            {otpError && (
              <p className="text-sm text-red-600 text-center mb-3">
                {otpError}
              </p>
            )}

            <Button className="w-full mb-3" onClick={handleVerifyOtp}>
              Verify OTP
            </Button>

            <button
              onClick={handleResendOtp}
              disabled={resendLoading}
              className="w-full text-sm text-primary font-semibold"
            >
              {resendLoading ? "Resending..." : "Resend OTP"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RegisterPage;
