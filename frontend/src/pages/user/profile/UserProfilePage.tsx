import React, { useState, useEffect } from "react"
import type { FormEvent, ChangeEvent } from "react"
import { Button } from "../../../components/ui/Button"
import { Input } from "../../../components/ui/Input"
import { Label } from "../../../components/ui/Label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../components/ui/Tabs"
import AvatarUpload from "../../../components/profile/AvatarUpload"
import { Eye, EyeOff, Lock } from "lucide-react"
import { useProfile } from "../../../hooks/useProfile"

const UserProfilePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"personal" | "password" | "security">("personal")
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const { profile, updateProfile, uploadAvatar, deleteAvatar, changePassword, setAppLockPin } = useProfile()

  const [name, setName] = useState<string>("")
  const [age, setAge] = useState<string>("")
  const [height, setHeight] = useState<string>("")
  const [weight, setWeight] = useState<string>("")
  const [email, setEmail] = useState<string>("")
  const [avatarUrl, setAvatarUrl] = useState<string>("")

  const [currentPassword, setCurrentPassword] = useState<string>("")
  const [newPassword, setNewPassword] = useState<string>("")
  const [confirmPassword, setConfirmPassword] = useState<string>("")
  const [showPasswords, setShowPasswords] = useState<boolean>(false)
  const [showPasswordSuccess, setShowPasswordSuccess] = useState<boolean>(false)

  const [showPinForm, setShowPinForm] = useState<boolean>(false)
  const [pinDigits, setPinDigits] = useState<string[]>(Array(6).fill(""))
  const [confirmPinDigits, setConfirmPinDigits] = useState<string[]>(Array(6).fill(""))

  useEffect(() => {
    if (profile) {
      setName(profile.fullName || "")
      setAge(profile.age?.toString() || "")
      setHeight(profile.heightCm?.toString() || "")
      setWeight(profile.weight?.toString() || "")
      setEmail(profile.email || "")
      setAvatarUrl(profile.avatarUrl || "")
    }
  }, [profile])

  const handlePersonalInfoSave = async (e: FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      await updateProfile({
        fullName: name,
        age: age ? parseInt(age) : undefined,
        heightCm: height ? parseInt(height) : undefined,
        weight: weight ? parseInt(weight) : undefined,
      })
    } catch (error) {
      console.error("Error updating profile:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handlePasswordChange = async (e: FormEvent) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      alert("New passwords do not match")
      return
    }
    setIsLoading(true)
    try {
      await changePassword({
        currentPassword,
        newPassword,
      })
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
      setShowPasswordSuccess(true)
    } catch (error) {
      console.error("Error changing password:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handlePinSetup = async (e: FormEvent) => {
    e.preventDefault()
    const pin = pinDigits.join("")
    const confirmPin = confirmPinDigits.join("")

    if (pin !== confirmPin) {
      alert("PINs do not match")
      return
    }
    if (pin.length !== 6) {
      alert("PIN must be 6 digits")
      return
    }

    setIsLoading(true)
    try {
      await setAppLockPin(pin)
      setShowPinForm(false)
      setPinDigits(Array(6).fill(""))
      setConfirmPinDigits(Array(6).fill(""))
    } catch (error) {
      console.error("Error setting PIN:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handlePinDigitChange = (
    index: number,
    value: string,
    isConfirm: boolean = false
  ) => {
    const digit = value.replace(/[^0-9]/g, "").slice(0, 1)
    const target = isConfirm ? [...confirmPinDigits] : [...pinDigits]
    target[index] = digit

    if (isConfirm) {
      setConfirmPinDigits(target)
    } else {
      setPinDigits(target)
    }

    if (digit && index < 5) {
      const nextId = isConfirm ? `confirm-pin-${index + 1}` : `pin-${index + 1}`
      document.getElementById(nextId)?.focus()
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/30">
      {/* Header */}
      <header className="border-b border-border bg-white/95 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-3">
          <img
            src="/healing-garden-logo.png"
            alt="Healing Garden Logo"
            width={40}
            height={40}
            className="rounded-lg"
          />
          <h1 className="text-2xl font-bold text-primary">My Profile</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Avatar & Member Info Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-border flex flex-col items-center">
              <AvatarUpload
                currentAvatar={avatarUrl}
                onAvatarChange={async (file) => {
                  await uploadAvatar(file).catch(console.error)
                }}
                onAvatarRemove={async () => {
                  await deleteAvatar().catch(console.error)
                }}
              />
              <div className="mt-6 pt-4 border-t border-border w-full text-center">
                <p className="text-sm font-semibold text-primary mb-1">Member Since</p>
                <p className="text-sm text-muted-foreground">
                  {profile?.createdAt
                    ? new Date(profile.createdAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })
                    : "N/A"}
                </p>
              </div>
            </div>
          </div>

          {/* Main Tabs Content */}
          <div className="lg:col-span-3">
            <Tabs
              value={activeTab}
              onValueChange={(value) =>
                setActiveTab(value as "personal" | "password" | "security")
              }
              className="bg-white rounded-2xl shadow-lg border border-border p-6"
            >
              <TabsList className="grid w-full grid-cols-3 bg-secondary/50 rounded-lg">
                <TabsTrigger
                  value="personal"
                  className="data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-sm"
                >
                  Personal Info
                </TabsTrigger>
                <TabsTrigger
                  value="password"
                  className="data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-sm"
                >
                  Password
                </TabsTrigger>
                <TabsTrigger
                  value="security"
                  className="data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-sm"
                >
                  Security
                </TabsTrigger>
              </TabsList>

              {/* Personal Info */}
              <TabsContent value="personal" className="mt-6 space-y-6">
                <form onSubmit={handlePersonalInfoSave} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-primary font-medium">
                      Full Name
                    </Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
                      className="h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-primary font-medium">
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                      className="h-11"
                      disabled
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="age" className="text-primary font-medium">
                      Age
                    </Label>
                    <Input
                      id="age"
                      type="number"
                      value={age}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => setAge(e.target.value)}
                      className="h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="height" className="text-primary font-medium">
                      Height (cm)
                    </Label>
                    <Input
                      id="height"
                      type="number"
                      value={height}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => setHeight(e.target.value)}
                      className="h-11"
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="weight" className="text-primary font-medium">
                      Weight (kg)
                    </Label>
                    <Input
                      id="weight"
                      type="number"
                      value={weight}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => setWeight(e.target.value)}
                      className="h-11"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="md:col-span-2 w-full h-11 bg-primary hover:bg-primary/90"
                  >
                    {isLoading ? "Saving..." : "Save Changes"}
                  </Button>
                </form>
              </TabsContent>

              {/* Password Change */}
              <TabsContent value="password" className="mt-6 space-y-6">
                <form onSubmit={handlePasswordChange} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="current-password" className="text-primary font-medium">
                      Current Password
                    </Label>
                    <div className="relative">
                      <Input
                        id="current-password"
                        type={showPasswords ? "text" : "password"}
                        value={currentPassword}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => setCurrentPassword(e.target.value)}
                        className="h-11 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords(!showPasswords)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        aria-label={showPasswords ? "Hide password" : "Show password"}
                      >
                        {showPasswords ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="new-password" className="text-primary font-medium">
                      New Password
                    </Label>
                    <Input
                      id="new-password"
                      type={showPasswords ? "text" : "password"}
                      value={newPassword}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => setNewPassword(e.target.value)}
                      className="h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirm-password" className="text-primary font-medium">
                      Confirm New Password
                    </Label>
                    <Input
                      id="confirm-password"
                      type={showPasswords ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value)}
                      className="h-11"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-11 bg-primary hover:bg-primary/90"
                  >
                    {isLoading ? "Updating..." : "Change Password"}
                  </Button>
                </form>
              </TabsContent>

              {/* Security / PIN Setup */}
              <TabsContent value="security" className="mt-6 space-y-6">
                <div className="bg-secondary/40 border border-border rounded-lg p-5">
                  <div className="flex items-start gap-3">
                    <Lock className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-primary mb-1.5">App Lock PIN</h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        Set a 6-digit PIN to protect your journal data when using the web browser.
                      </p>
                    </div>
                  </div>
                </div>

                {!showPinForm ? (
                  <Button
                    onClick={() => setShowPinForm(true)}
                    className="w-full h-11 bg-primary hover:bg-primary/90 gap-2"
                  >
                    <Lock size={18} />
                    Set App Lock PIN
                  </Button>
                ) : (
                  <form onSubmit={handlePinSetup} className="space-y-6">
                    <div className="space-y-3">
                      <Label className="text-primary font-medium">Enter 6-Digit PIN</Label>
                      <div className="grid grid-cols-6 gap-3">
                        {pinDigits.map((digit, i) => (
                          <Input
                            key={i}
                            id={`pin-${i}`}
                            type="password"
                            inputMode="numeric"
                            maxLength={1}
                            value={digit}
                            onChange={(e: ChangeEvent<HTMLInputElement>) => handlePinDigitChange(i, e.target.value, false)}
                            className="text-center text-xl font-bold h-12 border-2 focus:border-primary rounded-lg"
                            placeholder="*"
                          />
                        ))}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label className="text-primary font-medium">Confirm PIN</Label>
                      <div className="grid grid-cols-6 gap-3">
                        {confirmPinDigits.map((digit, i) => (
                          <Input
                            key={i}
                            id={`confirm-pin-${i}`}
                            type="password"
                            inputMode="numeric"
                            maxLength={1}
                            value={digit}
                            onChange={(e: ChangeEvent<HTMLInputElement>) => handlePinDigitChange(i, e.target.value, true)}
                            className="text-center text-xl font-bold h-12 border-2 focus:border-primary rounded-lg"
                            placeholder="*"
                          />
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setShowPinForm(false)
                          setPinDigits(Array(6).fill(""))
                          setConfirmPinDigits(Array(6).fill(""))
                        }}
                        className="flex-1 h-11"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={
                          isLoading ||
                          pinDigits.some(d => !d) ||
                          confirmPinDigits.some(d => !d)
                        }
                        className="flex-1 h-11 bg-primary hover:bg-primary/90"
                      >
                        {isLoading ? "Setting..." : "Set PIN"}
                      </Button>
                    </div>
                  </form>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>

      {showPasswordSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-foreground">
              Password updated
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Your password has been changed successfully.
            </p>
            <div className="mt-6">
              <Button
                type="button"
                className="w-full bg-primary text-white hover:bg-primary/90"
                onClick={() => setShowPasswordSuccess(false)}
              >
                OK
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default UserProfilePage
