import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import { Label } from "../../../components/ui/Label";

import { authApi } from "../../../api/authApi";
import { userApi } from "../../../api/userApi";
import { dailyCheckInApi } from "../../../api/dailyCheckInApi";
import { useDailyCheckInStore } from "../../../store/dailyCheckInStore";
import { useOnboardingStore } from "../../../store/onboardingStore";
import { AxiosError } from "axios";
import GoogleLogin from "../login/GoogleLogin";
import { BannedUserModal } from "../../../components/auth/BannedUserModal";

export default function LoginPage() {
  const navigate = useNavigate();
  const { setShowModal, resetStore: resetDailyStore } = useDailyCheckInStore();
  const { resetOnboarding } = useOnboardingStore();

  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  // Ban management state
  const [showBannedModal, setShowBannedModal] = useState<boolean>(false);
  const [bannedInfo, setBannedInfo] = useState<{
    expiresAt: string | null;
    reason: string;
  }>({ expiresAt: null, reason: "" });

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const res = await authApi.login({ email, password });

      const { accessToken, user } = res;
      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("access_token", accessToken);
      localStorage.setItem("user", JSON.stringify(user));

      resetDailyStore();
      resetOnboarding();

      if (user.role === "admin") {
        navigate("/admin/dashboard");
        return;
      }

      let isOnboarded = false;
      try {
        const statusRes = await userApi.getOnboardingStatus();
        isOnboarded = !!statusRes.isOnboarded;
      } catch {
        isOnboarded = false;
      }

      if (!isOnboarded) {
        navigate("/onboarding/step-1");
        return;
      }

      try {
        await dailyCheckInApi.getToday();
        navigate("/user/dashboard");
      } catch (err: unknown) {
        const status = (err as { response?: { status?: number } }).response
          ?.status;
        if (status === 404) {
          setShowModal(true);
          navigate("/user/dashboard");
        } else {
          console.error("Failed to check today check-in:", err);
          navigate("/user/dashboard");
        }
      }
    } catch (err: unknown) {
      let errMsg = err instanceof Error ? err.message : "Login failed";
      const errRes = (err as any)?.response?.data;
      if (errRes && typeof errRes.message === "string") {
        errMsg = errRes.message;
      }

      if (errMsg.includes('"isBanned":true')) {
        try {
          const parsed = JSON.parse(errMsg);
          setBannedInfo({
            expiresAt: parsed.banExpiresAt || null,
            reason: parsed.banReason || ""
          });
          setShowBannedModal(true);
          return;
        } catch (e) {
          // Fallback to normal error handling
        }
      }

      // Try resolving standard nested axios error structures just in case
      type ErrorResponse = { response?: { data?: { message?: string } } };
      if (
        typeof err === "object" &&
        err !== null &&
        "response" in err &&
        typeof (err as ErrorResponse).response === "object" &&
        (err as ErrorResponse).response?.data?.message
      ) {
        setError((err as ErrorResponse).response!.data!.message!);
      } else {
        setError(errMsg || "Login failed");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSuccess = async (accessToken: string) => {
    try {
      setIsLoading(true);

      const res = await authApi.googleLogin({
        credential: accessToken, // now using access token
      });

      localStorage.setItem("accessToken", res.accessToken);
      localStorage.setItem("access_token", res.accessToken); // Ensure compatibility with http.ts
      localStorage.setItem("user", JSON.stringify(res.user));

      resetDailyStore();
      resetOnboarding();

      if (res.user.role === "admin") {
        navigate("/admin/dashboard");
        return;
      }

      // Check onboarding status
      let isOnboarded = false;
      try {
        const statusRes = await userApi.getOnboardingStatus();
        isOnboarded = !!statusRes.isOnboarded;
      } catch {
        isOnboarded = false;
      }

      if (!isOnboarded) {
        navigate("/onboarding/step-1");
        return;
      }

      // Check today's check-in status
      try {
        await dailyCheckInApi.getToday();
        navigate("/user/dashboard");
      } catch (err: unknown) {
        const status = (err as { response?: { status?: number } }).response
          ?.status;
        if (status === 404) {
          setShowModal(true);
          navigate("/user/dashboard");
        } else {
          console.error("Failed to check today check-in:", err);
          navigate("/user/dashboard");
        }
      }
    } catch (err: unknown) {
      let errMsg = err instanceof Error ? err.message : "Google login failed";
      const errRes = (err as any)?.response?.data;
      if (errRes && typeof errRes.message === "string") {
        errMsg = errRes.message;
      }

      if (errMsg.includes('"isBanned":true')) {
        try {
          const parsed = JSON.parse(errMsg);
          setBannedInfo({
            expiresAt: parsed.banExpiresAt || null,
            reason: parsed.banReason || ""
          });
          setShowBannedModal(true);
          return;
        } catch (e) {
          // Fallback
        }
      }

      if (err instanceof AxiosError && err.response?.data) {
        const responseData = err.response.data;
        if (responseData.code === "LINK_GOOGLE_REQUIRED") {
          // show link account modal
          return;
        }
      }
      setError(errMsg || "Google login failed");
    } finally {
      setIsLoading(false);
    }
  };

  const location = useLocation();
  const fromLanding = location.state?.fromLanding;

  return (
    <>
      <div className={`auth-bg ${!fromLanding ? 'no-animation' : ''}`} />
      <div className="auth-card-container">
        {/* Overlay to ensure readability and animation */}
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
            <div className={`w-full md:w-1/2 p-8 md:p-12 lg:p-14 flex flex-col justify-center ${!fromLanding ? 'animate-fade-in-form-fast' : ''}`}>
              {/* Logo */}
              <div className="flex justify-center mb-6">
                <img
                  src="/healing-garden-logo.png"
                  alt="Healing Garden"
                  width={60}
                  height={60}
                  className="rounded-xl shadow-sm"
                />
              </div>

              <h1 className="text-3xl font-bold text-primary mb-1 text-center tracking-tight">
                Welcome Back
              </h1>
              <p className="text-center text-muted-foreground mb-8">
                Continue your healing journey
              </p>

              {error && (
                <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl animate-in fade-in slide-in-from-top-1">
                  {error}
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-semibold ml-1">
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="border-border/50 focus:border-primary h-12 rounded-xl bg-gray-50/50"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="password"
                    className="text-sm font-semibold ml-1"
                  >
                    Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="border-border/50 focus:border-primary h-12 rounded-xl bg-gray-50/50"
                    required
                  />
                  <div className="flex justify-end pr-1">
                    <Link
                      to="/forgot-password"
                      state={{ fromLanding }}
                      className="text-xs text-primary hover:underline font-medium"
                    >
                      Forgot password?
                    </Link>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-primary hover:bg-primary/90 text-white h-12 rounded-xl font-bold mt-6 shadow-lg shadow-primary/20 transition-all active:scale-[0.98]"
                >
                  {isLoading ? "Signing in..." : "Sign In"}
                </Button>
              </form>

              {/* Divider */}
              <div className="relative my-10">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border/30" />
                </div>
                <div className="relative flex justify-center text-[10px]">
                  <span className="px-4 bg-white text-muted-foreground uppercase tracking-widest font-bold">
                    or join with
                  </span>
                </div>
              </div>

              {/* Google login */}
              <div className="flex justify-center">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                />
              </div>

              {/* Links */}
              <div className="mt-10 text-center text-sm">
                <span className="text-muted-foreground">
                  Don't have an account?{" "}
                </span>
                <Link
                  to="/register"
                  state={{ fromLanding: false }}
                  className="text-primary hover:text-primary/80 font-bold underline-offset-4 hover:underline"
                >
                  Sign up
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
                    <h2 className="text-3xl font-bold mb-2 shadow-sm">Connect with Nature</h2>
                    <p className="text-white/80 font-medium">Every step forward is a bloom in your inner garden.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <BannedUserModal
          isOpen={showBannedModal}
          onClose={() => setShowBannedModal(false)}
          banExpiresAt={bannedInfo.expiresAt}
          banReason={bannedInfo.reason}
        />
      </div>
    </>
  );
}
