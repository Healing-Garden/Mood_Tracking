import React, { useState, useEffect } from 'react'
import type { FormEvent, ChangeEvent } from 'react'
import { Button } from '../../../components/ui/Button'
import { Input } from '../../../components/ui/Input'
import { Label } from '../../../components/ui/Label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/Tabs'
import AvatarUpload from '../../../components/profile/AvatarUpload'
import { Eye, EyeOff, Lock, Menu, X, AlertCircle } from 'lucide-react'
import DashboardSidebar from '../../../components/layout/DashboardSideBar'
import { Card, CardContent } from '../../../components/ui/Card'
import { useProfile } from '../../../hooks/useProfile'

const UserProfilePage: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false)
  const [activeTab, setActiveTab] = useState<'personal' | 'password' | 'security'>('personal')
  const [passwordError, setPasswordError] = useState<string>('')
  const [personalError, setPersonalError] = useState<string>('')
  const [showFormSuccess, setShowFormSuccess] = useState(false)

  // Use the useProfile hook
  const {
    profile,
    loading,
    error,
    updateProfile: updateProfileAPI,
    uploadAvatar,
    deleteAvatar,
    changePassword: changePasswordAPI,
    setAppLockPin: setAppLockPinAPI,
  } = useProfile()

  // Personal Info
  const [name, setName] = useState<string>('')
  const [age, setAge] = useState<string>('')
  const [height, setHeight] = useState<string>('')
  const [weight, setWeight] = useState<string>('')
  const [email, setEmail] = useState<string>('')

  // Password
  const [currentPassword, setCurrentPassword] = useState<string>('')
  const [newPassword, setNewPassword] = useState<string>('')
  const [confirmPassword, setConfirmPassword] = useState<string>('')
  const [showPasswords, setShowPasswords] = useState<boolean>(false)

  // PIN
  const [showPinForm, setShowPinForm] = useState<boolean>(false)
  const [pinDigits, setPinDigits] = useState<string[]>(Array(6).fill(''))
  const [confirmPinDigits, setConfirmPinDigits] = useState<string[]>(Array(6).fill(''))

  // Load profile data from API response
  useEffect(() => {
    if (profile) {
      setName(profile.fullName || '')
      setAge(profile.age?.toString() || '')
      setHeight(profile.heightCm?.toString() || '')
      setWeight(profile.weight?.toString() || '')
      setEmail(profile.email || '')
    }
  }, [profile])

  // Clear success message after 3 seconds
  useEffect(() => {
    if (showFormSuccess) {
      const timer = setTimeout(() => setShowFormSuccess(false), 3000)
      return () => clearTimeout(timer)
    }
  }, [showFormSuccess])

  const handlePersonalInfoSave = async (e: FormEvent) => {
    e.preventDefault()
    setPersonalError('')

    if (!name.trim()) {
      setPersonalError('Full name is required')
      return
    }

    if (age && (isNaN(Number(age)) || Number(age) < 0)) {
      setPersonalError('Age must be a valid number')
      return
    }

    if (height && (isNaN(Number(height)) || Number(height) < 0)) {
      setPersonalError('Height must be a valid number')
      return
    }

    if (weight && (isNaN(Number(weight)) || Number(weight) < 0)) {
      setPersonalError('Weight must be a valid number')
      return
    }

    try {
      await updateProfileAPI({
        fullName: name.trim(),
        age: age ? Number(age) : undefined,
        heightCm: height ? Number(height) : undefined,
        weight: weight ? Number(weight) : undefined,
      })
      setShowFormSuccess(true)
    } catch (err: any) {
      setPersonalError(err?.response?.data?.message || 'Failed to update profile')
    }
  }

  const handlePasswordChange = async (e: FormEvent) => {
    e.preventDefault()
    setPasswordError('')

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('All password fields are required')
      return
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match')
      return
    }

    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long')
      return
    }

    if (currentPassword === newPassword) {
      setPasswordError('New password must be different from current password')
      return
    }

    try {
      await changePasswordAPI({
        currentPassword,
        newPassword,
      })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setShowFormSuccess(true)
    } catch (err: any) {
      setPasswordError(err?.response?.data?.message || 'Failed to change password')
    }
  }

  const handlePinSetup = async (e: FormEvent) => {
    e.preventDefault()
    const pin = pinDigits.join('')
    const confirmPin = confirmPinDigits.join('')

    if (pin !== confirmPin) {
      alert('PINs do not match')
      return
    }
    if (pin.length !== 6) {
      alert('PIN must be 6 digits')
      return
    }

    try {
      await setAppLockPinAPI(pin)
      setShowPinForm(false)
      setPinDigits(Array(6).fill(''))
      setConfirmPinDigits(Array(6).fill(''))
      setShowFormSuccess(true)
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to set PIN')
    }
  }

  const handlePinDigitChange = (
    index: number,
    value: string,
    isConfirm: boolean = false
  ) => {
    const digit = value.replace(/[^0-9]/g, '').slice(0, 1)
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
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-30 ${sidebarOpen ? 'block' : 'hidden'} lg:static lg:block`}>
        <DashboardSidebar userType="user" onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="sticky top-0 z-10 bg-white border-b border-border/50 shadow-sm">
          <div className="px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-primary">My Profile</h1>

            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 hover:bg-muted rounded-lg"
            >
              {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Avatar & Member Info Sidebar */}
          <div className="lg:col-span-1">
            <Card className="bg-white rounded-2xl shadow-lg border-border flex flex-col items-center p-6">
              {loading ? (
                <div className="w-32 h-32 rounded-full bg-secondary/30 flex items-center justify-center">
                  <p className="text-sm text-muted-foreground">Loading...</p>
                </div>
              ) : (
                <AvatarUpload
                  currentAvatar={profile?.avatarUrl}
                  onAvatarChange={async (file: File) => {
                    await uploadAvatar(file)
                  }}
                  onAvatarRemove={deleteAvatar}
                />
              )}
              <div className="mt-6 pt-4 border-t border-border w-full text-center">
                <p className="text-sm font-semibold text-primary mb-1">Member Since</p>
                <p className="text-sm text-muted-foreground">
                  {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long' }) : 'N/A'}
                </p>
              </div>
            </Card>
          </div>

          {/* Main Tabs Content */}
          <div className="lg:col-span-3">
            <Card className="bg-white rounded-2xl shadow-lg border-border p-6">
            <Tabs
              value={activeTab}
              onValueChange={(value) =>
                setActiveTab(value as 'personal' | 'password' | 'security')
              }
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
                {personalError && (
                  <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                    <p className="text-sm text-red-700">{personalError}</p>
                  </div>
                )}
                {showFormSuccess && activeTab === 'personal' && (
                  <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-700">Profile updated successfully!</p>
                  </div>
                )}
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
                      disabled={loading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-primary font-medium">
                      Email (Cannot be changed)
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
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
                      disabled={loading}
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
                      disabled={loading}
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
                      disabled={loading}
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="md:col-span-2 w-full h-11 bg-primary hover:bg-primary/90"
                  >
                    {loading ? 'Saving...' : 'Save Changes'}
                  </Button>
                </form>
              </TabsContent>

              {/* Password Change */}
              <TabsContent value="password" className="mt-6 space-y-6">
                {profile?.authProvider === 'google' ? (
                  <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <AlertCircle className="w-5 h-5 text-blue-500 flex-shrink-0" />
                    <p className="text-sm text-blue-700">
                      You are signed in with Google. Please use your Google account settings to change your password.
                    </p>
                  </div>
                ) : profile?.authProvider === 'both' || profile?.authProvider === 'local' ? (
                  <>
                    {passwordError && (
                      <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                        <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                        <p className="text-sm text-red-700">{passwordError}</p>
                      </div>
                    )}
                    {showFormSuccess && activeTab === 'password' && (
                      <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-sm text-green-700">Password changed successfully!</p>
                      </div>
                    )}
                    <form onSubmit={handlePasswordChange} className="space-y-5">
                      <div className="space-y-2">
                        <Label htmlFor="current-password" className="text-primary font-medium">
                          Current Password
                        </Label>
                        <div className="relative">
                          <Input
                            id="current-password"
                            type={showPasswords ? 'text' : 'password'}
                            value={currentPassword}
                            onChange={(e: ChangeEvent<HTMLInputElement>) => setCurrentPassword(e.target.value)}
                            className="h-11 pr-10"
                            disabled={loading}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPasswords(!showPasswords)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            aria-label={showPasswords ? 'Hide password' : 'Show password'}
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
                          type={showPasswords ? 'text' : 'password'}
                          value={newPassword}
                          onChange={(e: ChangeEvent<HTMLInputElement>) => setNewPassword(e.target.value)}
                          className="h-11"
                          disabled={loading}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="confirm-password" className="text-primary font-medium">
                          Confirm New Password
                        </Label>
                        <Input
                          id="confirm-password"
                          type={showPasswords ? 'text' : 'password'}
                          value={confirmPassword}
                          onChange={(e: ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value)}
                          className="h-11"
                          disabled={loading}
                        />
                      </div>

                      <Button
                        type="submit"
                        disabled={loading}
                        className="w-full h-11 bg-primary hover:bg-primary/90"
                      >
                        {loading ? 'Updating...' : 'Change Password'}
                      </Button>
                    </form>
                  </>
                ) : null}
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
                    disabled={loading}
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
                            placeholder="•"
                            disabled={loading}
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
                            placeholder="•"
                            disabled={loading}
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
                          setPinDigits(Array(6).fill(''))
                          setConfirmPinDigits(Array(6).fill(''))
                        }}
                        className="flex-1 h-11"
                        disabled={loading}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={
                          loading ||
                          pinDigits.some(d => !d) ||
                          confirmPinDigits.some(d => !d)
                        }
                        className="flex-1 h-11 bg-primary hover:bg-primary/90"
                      >
                        {loading ? 'Setting...' : 'Set PIN'}
                      </Button>
                    </div>
                  </form>
                )}
              </TabsContent>
            </Tabs>
            </Card>
          </div>
        </div>
        </main>
      </div>
    </div>
  )
}

export default UserProfilePage