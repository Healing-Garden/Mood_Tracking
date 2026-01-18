import { Button } from "../../components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { Heart, ArrowLeft } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";

export default function RegisterPage() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleRegister = () => {
    if (
      formData.name.trim() &&
      formData.email.trim() &&
      formData.password === formData.confirmPassword &&
      formData.password.length >= 8
    ) {
      // TODO: Gọi API đăng ký ở đây
      navigate(`/onboarding?name=${encodeURIComponent(formData.name)}`);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/5 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <Link to="/">
          <Button
            variant="ghost"
            className="mb-8 -ml-4 text-foreground/70 hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </Link>

        <Card className="border border-border/40 bg-card/60 backdrop-blur">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <Heart className="w-7 h-7 text-primary-foreground" />
              </div>
            </div>
            <CardTitle className="text-2xl text-foreground">Create Account</CardTitle>
            <CardDescription className="text-foreground/60">
              Begin your mental health journey today
            </CardDescription>
          </CardHeader>

          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Full Name
                </label>
                <Input
                  type="text"
                  name="name"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={handleChange}
                  className="bg-background border-border/60 text-foreground placeholder:text-foreground/50 rounded-lg"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Email
                </label>
                <Input
                  type="email"
                  name="email"
                  placeholder="your@email.com"
                  value={formData.email}
                  onChange={handleChange}
                  className="bg-background border-border/60 text-foreground placeholder:text-foreground/50 rounded-lg"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Password
                </label>
                <Input
                  type="password"
                  name="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  className="bg-background border-border/60 text-foreground placeholder:text-foreground/50 rounded-lg"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Confirm Password
                </label>
                <Input
                  type="password"
                  name="confirmPassword"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="bg-background border-border/60 text-foreground placeholder:text-foreground/50 rounded-lg"
                />
              </div>

              <Button
                onClick={handleRegister}
                disabled={
                  !formData.name.trim() ||
                  !formData.email.trim() ||
                  formData.password !== formData.confirmPassword ||
                  formData.password.length < 8
                }
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg disabled:opacity-50"
              >
                Create Account
              </Button>
            </div>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border/40"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-card text-foreground/60">Or sign up with</span>
              </div>
            </div>

            <Button
              variant="outline"
              className="w-full border-border/60 text-foreground rounded-lg bg-transparent"
            >
              Continue with Google
            </Button>

            <p className="text-center text-sm text-foreground/60 mt-6">
              Already have an account?{" "}
              <Link to="/login" className="text-primary hover:underline font-medium">
                Login
              </Link>
            </p>

            <p className="text-xs text-foreground/50 mt-4 text-center">
              By signing up, you agree to our Terms of Service and Privacy Policy
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}