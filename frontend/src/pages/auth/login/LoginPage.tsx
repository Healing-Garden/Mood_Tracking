import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Leaf } from "lucide-react";

import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import { Label } from "../../../components/ui/Label";

import { authApi } from "../../../api/authApi";
import { userApi } from "../../../api/userApi";
import { dailyCheckInApi } from "../../../api/dailyCheckInApi";
import { useDailyCheckInStore } from "../../../store/dailyCheckInStore";
import { useOnboardingStore } from "../../../store/onboardingStore";

export default function LoginPage() {
  const navigate = useNavigate();
  const { setShowModal, resetStore: resetDailyStore } = useDailyCheckInStore();
  const { resetOnboarding } = useOnboardingStore();

  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

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

      // Kiểm tra user đã hoàn thành onboarding chưa
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

      // Kiểm tra daily check-in
      try {
        await dailyCheckInApi.getToday();
        navigate("/user/dashboard");
      } catch (err: any) {
        const status = err?.response?.status;
        if (status === 404) {
          setShowModal(true);
          navigate("/user/dashboard");
        } else {
          console.error("Failed to check today check-in:", err);
          navigate("/user/dashboard");
        }
      }
    } catch (err) {
      type ErrorResponse = { response?: { data?: { message?: string } } };
      if (typeof err === "object" && err !== null && "response" in err && typeof (err as ErrorResponse).response === "object") {
        setError((err as ErrorResponse).response?.data?.message || "Login failed");
      } else {
        setError("Login failed");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    setIsLoading(true);

    // TODO: Implement Google OAuth
    console.log("Google OAuth login");

    setTimeout(() => {
      setIsLoading(false);
      navigate("/dashboard");
    }, 500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted flex items-center justify-center px-4 relative overflow-hidden">
      {/* Decorative leaves */}
      <div className="absolute top-10 right-10 opacity-15 pointer-events-none">
        <Leaf size={80} className="text-primary animate-pulse" />
      </div>

      <div
        className="absolute bottom-10 left-10 opacity-15 pointer-events-none"
        style={{ animationDelay: "1s" }}
      >
        <Leaf size={100} className="text-primary animate-pulse" />
      </div>

      <div className="w-full max-w-md z-10">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <img
            src="/healing-garden-logo.png"
            alt="Healing Garden"
            width={100}
            height={100}
            className="rounded-lg"
          />
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-border/50">
          <h1 className="text-3xl font-bold text-foreground mb-2 text-center">
            Welcome Back
          </h1>
          <p className="text-center text-muted-foreground mb-8">
            Continue your healing journey
          </p>

          {error && (
            <div className="mb-4 p-3 bg-destructive/10 border border-destructive/30 text-destructive text-sm rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground font-semibold">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="border-border/50 focus:border-primary h-11"
                required
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="password"
                className="text-foreground font-semibold"
              >
                Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="border-border/50 focus:border-primary h-11"
                required
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary hover:bg-primary/90 text-white h-11 font-semibold mt-6"
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border/30" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-2 bg-white text-muted-foreground">
                or continue with
              </span>
            </div>
          </div>

          {/* Google login */}
          <Button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isLoading}
            variant="outline"
            className="w-full border-border/50 text-foreground hover:bg-muted/50 h-11 font-medium bg-white flex items-center justify-center gap-2"
          >
            <span className="font-semibold">G</span>
            Login with Google
          </Button>

          {/* Links */}
          <div className="mt-6 text-center text-sm space-y-3">
            <div>
              <span className="text-muted-foreground">
                Don't have an account?{" "}
              </span>
              <Link
                to="/register"
                className="text-primary hover:text-primary/80 font-semibold"
              >
                Sign up
              </Link>
            </div>

            <div>
              <Link
                to="/forgot-password"
                className="text-primary hover:text-primary/80 font-semibold"
              >
                Forgot Password?
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}