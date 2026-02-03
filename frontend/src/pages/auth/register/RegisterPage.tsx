import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Leaf, X } from "lucide-react";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import { Label } from "../../../components/ui/Label";
import { authApi } from "../../../api/authApi";

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();

  // ===== FORM DATA =====
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [age, setAge] = useState("");
  const [weight, setWeight] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // ===== OTP =====
  const [otp, setOtp] = useState<string[]>(Array(6).fill(""));
  const [showOtpModal, setShowOtpModal] = useState(false);

  // ===== UI =====
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [otpError, setOtpError] = useState("");
  const [resendLoading, setResendLoading] = useState(false);

  /* ================= REGISTER ================= */
  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (!fullName || !email || !age || !weight || !password) {
      setError("Please fill all required fields");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setLoading(true);
    try {
      await authApi.register({
        fullName,
        email,
        password,
        age: Number(age),
        weight: Number(weight),
      });

      // ✅ mở popup OTP
      setShowOtpModal(true);
    } catch (err: any) {
      setError(err || "Register failed");
    } finally {
      setLoading(false);
    }
  };

  /* ================= VERIFY OTP ================= */
  const handleVerifyOtp = async () => {
    setOtpError("");

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

      navigate("/app/dashboard");
    } catch (err: any) {
      setOtpError(err || "OTP invalid");
    } finally {
      setLoading(false);
    }
  };

  /* ================= RESEND OTP ================= */
  const handleResendOtp = async () => {
    setResendLoading(true);
    setOtpError("");
    try {
      await authApi.register({
        fullName,
        email,
        password,
        age: Number(age),
        weight: Number(weight),
      });
    } catch (err: any) {
      setOtpError(err || "Cannot resend OTP");
    } finally {
      setResendLoading(false);
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
          <h1 className="text-3xl font-bold text-primary mb-2 text-center">
            Create Your Account
          </h1>
          <p className="text-center text-muted-foreground mb-8">
            Start your wellness journey today
          </p>

          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Age</Label>
                <Input
                  type="number"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Weight (kg)</Label>
                <Input
                  type="number"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Password</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Confirm Password</Label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
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
              onClick={() => setShowOtpModal(false)}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
            >
              <X size={20} />
            </button>

            <h2 className="text-xl font-bold text-center mb-2">
              Verify your email
            </h2>
            <p className="text-sm text-center text-muted-foreground mb-6">
              Enter the 6-digit code sent to {email}
            </p>

            <div className="flex justify-between gap-2 mb-4">
              {otp.map((v, i) => (
                <Input
                  key={i}
                  maxLength={1}
                  className="w-12 h-12 text-center text-xl"
                  value={v}
                  onChange={(e) => {
                    const digit = e.target.value.replace(/\D/g, "");
                    const next = [...otp];
                    next[i] = digit;
                    setOtp(next);
                  }}
                />
              ))}
            </div>

            {otpError && (
              <p className="text-sm text-red-600 text-center mb-3">
                {otpError}
              </p>
            )}

            <Button
              className="w-full mb-3"
              disabled={loading}
              onClick={handleVerifyOtp}
            >
              {loading ? "Verifying..." : "Verify OTP"}
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
