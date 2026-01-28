import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from "react-router-dom"
import { Leaf } from "lucide-react"
import { Button } from '../../../components/ui/Button'
import { Input } from '../../../components/ui/Input'
import { Label } from '../../../components/ui/Label'

const RegisterPage: React.FC = () => {
  const [step, setStep] = useState<"form" | "otp" | "checkin">("form")
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [otp, setOtp] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleRegister = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError("")

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters")
      return
    }

    setIsLoading(true)
    console.log("Register:", { fullName, email, password })

    setTimeout(() => {
      setStep("otp")
      setIsLoading(false)
    }, 1000)
  }

  const handleVerifyOTP = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError("")

    if (otp.length !== 6) {
      setError("Please enter a valid 6-digit OTP")
      return
    }

    setIsLoading(true)
    console.log("Verify OTP:", { email, otp })

    setTimeout(() => {
      setStep("checkin")
      setIsLoading(false)
    }, 1000)
  }

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
          {/* STEP 1: REGISTER FORM */}
          {step === "form" && (
            <>
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
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Password</Label>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    At least 8 characters
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Confirm Password</Label>
                  <Input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>

                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-11"
                >
                  {isLoading ? "Creating Account..." : "Create Account"}
                </Button>
              </form>

              <div className="mt-6 text-center text-sm">
                Already have an account?{" "}
                <Link to="/login" className="text-primary font-semibold">
                  Sign In
                </Link>
              </div>
            </>
          )}

          {/* STEP 2: OTP */}
          {step === "otp" && (
            <>
              <h1 className="text-3xl font-bold text-primary text-center mb-2">
                Verify Your Email
              </h1>
              <p className="text-center text-muted-foreground mb-8">
                Enter the 6-digit code sent to {email}
              </p>

              <form onSubmit={handleVerifyOTP} className="space-y-6">
                <div className="flex gap-2 justify-between">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Input
                      key={i}
                      maxLength={1}
                      value={otp[i] || ""}
                      onChange={(e) => {
                        const v = e.target.value.replace(/\D/g, "")
                        setOtp(
                          otp.substring(0, i) + v + otp.substring(i + 1)
                        )
                      }}
                      className="w-12 h-12 text-center text-xl"
                    />
                  ))}
                </div>

                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={isLoading || otp.length !== 6}
                  className="w-full h-11"
                >
                  {isLoading ? "Verifying..." : "Verify Code"}
                </Button>
              </form>
            </>
          )}

          {/* STEP 3: CHECK-IN */}
          {step === "checkin" && (
            <>
              <h1 className="text-2xl font-bold text-primary text-center mb-2">
                Welcome!
              </h1>
              <p className="text-center text-muted-foreground mb-8">
                Let's set up your first check-in
              </p>

              <div className="space-y-6">
                <div className="flex justify-center gap-3 text-3xl">
                  {["😀", "😊", "😐", "😔", "😢"].map((e) => (
                    <button
                      key={e}
                      type="button"
                      className="p-2 rounded-lg hover:bg-muted"
                    >
                      {e}
                    </button>
                  ))}
                </div>

                <Link to="/user/dashboard">
                  <Button className="w-full h-11">
                    Complete Setup
                  </Button>
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default RegisterPage
