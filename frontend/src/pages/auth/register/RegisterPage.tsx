import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { X, Eye, EyeOff, ArrowLeft } from "lucide-react";
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
    } catch (err) {
      if (
        typeof err === "object" &&
        err !== null &&
        "response" in err &&
        typeof (err as { response?: unknown }).response === "object"
      ) {
        const errorObj = err as { response?: { data?: { message?: string } } };
        setError(errorObj.response?.data?.message || "Register failed");
      } else {
        setError("Register failed");
      }
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
      } catch { }
      try {
        resetDailyStore()
      } catch { }

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
      if (
        typeof err === "object" &&
        err !== null &&
        "response" in err &&
        typeof (err as { response?: unknown }).response === "object"
      ) {
        const errorObj = err as { response?: { data?: { message?: string } } };
        setOtpError(errorObj.response?.data?.message || "OTP invalid");
      } else {
        setOtpError("OTP invalid");
      }
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

  const location = useLocation();
  const fromLanding = location.state?.fromLanding;

  return (
    <>
      <div className={`auth-bg ${!fromLanding ? 'no-animation' : ''}`} />
      <div className="auth-card-container">
        {/* Overlay for readability and animation */}
        <div className={`auth-overlay ${!fromLanding ? 'no-animation' : ''}`} />

        {/* Back to Home Button */}
        <Link
          to="/"
          className="absolute top-6 left-6 z-20 flex items-center gap-2 text-white/80 hover:text-white transition-all bg-black/20 hover:bg-black/40 backdrop-blur-md px-4 py-2 rounded-full border border-white/20 group"
        >
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          <span className="font-medium text-sm">Back to Home</span>
        </Link>

        <div className={`w-full max-w-[1004px] z-10 ${fromLanding ? 'animate-fade-in-form' : ''}`}>
          <div className="bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-border/50 flex flex-col md:flex-row min-h-[650px]">
            {/* Left: Form area - animates only when NOT coming from landing */}
            <div className={`w-full md:w-1/2 p-8 md:p-12 lg:p-14 flex flex-col justify-center overflow-y-auto custom-scrollbar ${!fromLanding ? 'animate-fade-in-form-fast' : ''}`}>
              {/* Logo */}
              <div className="flex justify-center mb-6">
                <img
                  src="/healing-garden-logo.png"
                  alt="Healing Garden"
                  width={55}
                  height={55}
                  className="rounded-xl shadow-sm"
                />
              </div>

              <h1 className="text-3xl font-bold text-primary mb-1 text-center tracking-tight">
                Create Your Account
              </h1>
              <p className="text-center text-muted-foreground mb-8">
                Start your wellness journey today
              </p>

              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-sm font-semibold ml-1">Full Name</Label>
                  <Input
                    className="h-12 text-sm focus:border-primary border-border/50 rounded-xl bg-gray-50/50"
                    placeholder="Enter your full name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>

                {/* Email */}
                <div className="space-y-1.5">
                  <Label className="text-sm font-semibold ml-1">Email</Label>
                  <Input
                    className="h-12 text-sm focus:border-primary border-border/50 rounded-xl bg-gray-50/50"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setEmailError("");
                    }}
                  />
                  {emailError && (
                    <p className="text-xs text-red-600 ml-1 font-medium">{emailError}</p>
                  )}
                </div>

                {/* Password split row */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-sm font-semibold ml-1">Password</Label>
                    <div className="relative">
                      <Input
                        className="h-12 text-sm focus:border-primary border-border/50 pr-10 rounded-xl bg-gray-50/50"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          setPasswordError("");
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-4 text-muted-foreground hover:text-primary transition-colors"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-sm font-semibold ml-1">Confirm</Label>
                    <div className="relative">
                      <Input
                        className="h-12 text-sm focus:border-primary border-border/50 pr-10 rounded-xl bg-gray-50/50"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => {
                          setConfirmPassword(e.target.value);
                          setConfirmPasswordError("");
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-4 text-muted-foreground hover:text-primary transition-colors"
                      >
                        {showConfirmPassword ? (
                          <EyeOff size={18} />
                        ) : (
                          <Eye size={18} />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                <ul className="text-xs grid grid-cols-2 gap-x-2 gap-y-1 leading-tight bg-green-50/50 p-3 rounded-xl border border-green-100/50">
                  <li className={passwordChecklist.length ? "text-green-600 font-bold" : "text-red-500"}>
                    • 8+ chars
                  </li>
                  <li className={passwordChecklist.upper ? "text-green-600 font-bold" : "text-red-500"}>
                    • 1 Uppercase
                  </li>
                  <li className={passwordChecklist.number ? "text-green-600 font-bold" : "text-red-500"}>
                    • 1 Number
                  </li>
                  <li className={passwordChecklist.special ? "text-green-600 font-bold" : "text-red-500"}>
                    • 1 Special
                  </li>
                </ul>

                {(passwordError || confirmPasswordError) && (
                  <p className="text-xs text-red-600 ml-1 font-medium">
                    {passwordError || confirmPasswordError}
                  </p>
                )}

                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl animate-in fade-in">
                    <p className="text-xs text-red-600 text-center">{error}</p>
                  </div>
                )}

                <Button className="w-full h-12 rounded-xl font-bold shadow-lg mt-2 active:scale-[0.98] transition-all" disabled={loading}>
                  {loading ? "Creating..." : "Create Account"}
                </Button>
              </form>

              <div className="mt-8 text-center text-sm">
                <span className="text-muted-foreground">Already have an account? </span>
                <Link to="/login" state={{ fromLanding: false }} className="text-primary font-bold hover:underline underline-offset-4">
                  Sign In
                </Link>
              </div>
            </div>

            {/* Right: Image */}
            <div className="hidden md:flex w-1/2 p-4">
              <div
                className="w-full h-full bg-cover bg-center relative rounded-[2rem] overflow-hidden"
                style={{ backgroundImage: "url('/login_form_1 (2).jpg')" }}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent flex items-end p-10">
                  <div className="text-white">
                    <h2 className="text-3xl font-bold mb-2 shadow-sm">Grow with Us</h2>
                    <p className="text-white/80 font-medium">Start your journey towards emotional wellness and inner peace.</p>
                  </div>
                </div>
              </div>
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
    </>
  );
};

export default RegisterPage;
