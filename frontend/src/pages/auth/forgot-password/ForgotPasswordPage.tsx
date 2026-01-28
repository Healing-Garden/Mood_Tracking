import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from "react-router-dom"
import { Leaf } from "lucide-react"
import { Button } from '../../../components/ui/Button'
import { Input } from '../../../components/ui/Input'
import { Label } from '../../../components/ui/Label'

type Step = "email" | "verify" | "reset"
type UserType = "user" | "admin" | null

const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate()

  const [step, setStep] = useState<Step>("email")
  const [detectedUserType, setDetectedUserType] = useState<UserType>(null)

  const [email, setEmail] = useState("")
  const [otp, setOtp] = useState("")
  const [recoveryCode, setRecoveryCode] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  /* STEP 1: EMAIL SUBMIT */
  const handleEmailSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    const isAdmin = email.includes("admin") || email.includes("adm")
    console.log(`Email submitted: ${email}, detected as ${isAdmin ? "admin" : "user"}`)

    setTimeout(() => {
      setDetectedUserType(isAdmin ? "admin" : "user")
      setStep("verify")
      setIsLoading(false)
    }, 1000)
  }

  /* STEP 2: VERIFY */
  const handleVerify = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError("")

    if (!detectedUserType) return

    if (detectedUserType === "user" && otp.length !== 6) {
      setError("Please enter a valid 6-digit OTP")
      return
    }

    if (detectedUserType === "admin" && !recoveryCode.trim()) {
      setError("Please enter your recovery code")
      return
    }

    setIsLoading(true)
    console.log(
      "Verify:",
      detectedUserType === "user" ? otp : recoveryCode
    )

    setTimeout(() => {
      setStep("reset")
      setIsLoading(false)
    }, 1000)
  }

  /* STEP 3: RESET PASSWORD */
  const handleResetPassword = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError("")

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters")
      return
    }

    setIsLoading(true)
    console.log("Reset password for:", email)

    setTimeout(() => {
      navigate("/login")
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
          {step === "verify" && detectedUserType && (
            <>
              <h1 className="text-3xl font-bold text-primary text-center mb-2">
                {detectedUserType === "admin"
                  ? "Enter Recovery Code"
                  : "Verify Your Email"}
              </h1>

              <form onSubmit={handleVerify} className="space-y-6">
                {detectedUserType === "user" ? (
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
                ) : (
                  <Input
                    value={recoveryCode}
                    onChange={(e) => setRecoveryCode(e.target.value)}
                    placeholder="Enter recovery code"
                  />
                )}

                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}

                <Button
                  disabled={
                    isLoading ||
                    (detectedUserType === "user"
                      ? otp.length !== 6
                      : !recoveryCode)
                  }
                  className="w-full h-11"
                >
                  {isLoading ? "Verifying..." : "Verify"}
                </Button>
              </form>
            </>
          )}

          {/* STEP RESET */}
          {step === "reset" && (
            <>
              <h1 className="text-3xl font-bold text-primary text-center mb-2">
                Set New Password
              </h1>

              <form onSubmit={handleResetPassword} className="space-y-4">
                <Input
                  type="password"
                  placeholder="New password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <Input
                  type="password"
                  placeholder="Confirm password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />

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
  )
}

export default ForgotPasswordPage
