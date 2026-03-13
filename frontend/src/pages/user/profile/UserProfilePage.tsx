import React, { useState, useEffect } from 'react'
import type { FormEvent, ChangeEvent } from 'react'
import { Button } from '../../../components/ui/Button'
import { Input } from '../../../components/ui/Input'
import { Label } from '../../../components/ui/Label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/Tabs'
import AvatarUpload from '../../../components/profile/AvatarUpload'
import { Eye, EyeOff, Lock, X } from 'lucide-react'
import DashboardLayout from '../../../components/layout/DashboardLayout'
import { Card } from '../../../components/ui/Card'
import { useToast } from '../../../hooks/use-toast'
import { userApi } from '../../../api/userApi'

const UserProfilePage: React.FC = () => {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState<'personal' | 'password' | 'security'>('personal')
  const [isLoadingProfile, setIsLoadingProfile] = useState<boolean>(true)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState<boolean>(false)
  const [successMessage, setSuccessMessage] = useState<string>('')
  const [showEditModal, setShowEditModal] = useState<boolean>(false)

  // Personal Info
  const [name, setName] = useState<string>('')
  const [age, setAge] = useState<string>('')
  const [height, setHeight] = useState<string>('')
  const [weight, setWeight] = useState<string>('')
  const [email, setEmail] = useState<string>('')
  const [avatar, setAvatar] = useState<string>('')

  // Password
  const [currentPassword, setCurrentPassword] = useState<string>('')
  const [newPassword, setNewPassword] = useState<string>('')
  const [confirmPassword, setConfirmPassword] = useState<string>('')
  const [showPasswords, setShowPasswords] = useState<boolean>(false)
  const [passwordError, setPasswordError] = useState<string>('')
  const [hasPassword, setHasPassword] = useState<boolean>(true)
  const [isSettingPassword, setIsSettingPassword] = useState<boolean>(false)

  // PIN
  const [showPinForm, setShowPinForm] = useState<boolean>(false)
  const [pinDigits, setPinDigits] = useState<string[]>(Array(6).fill(''))
  const [confirmPinDigits, setConfirmPinDigits] = useState<string[]>(Array(6).fill(''))
  const [isAppLockEnabled, setIsAppLockEnabled] = useState<boolean>(false)
  const [hasPinSet, setHasPinSet] = useState<boolean>(false)

  const showSuccess = (message: string) => {
    setSuccessMessage(message)
    console.log(`[PROFILE_SUCCESS] ${message}`)
  }

  // Load user profile on mount
  useEffect(() => {
    const loadProfile = async () => {
      try {
        setIsLoadingProfile(true)
        const profile = await userApi.getProfile()
        setName(profile.fullName || '')
        setEmail(profile.email || '')
        setAge(profile.age?.toString() || '')
        setHeight(profile.heightCm?.toString() || '')
        setWeight(profile.weight?.toString() || '')
        setAvatar(profile.avatarUrl || '')
        setHasPassword(profile.hasPassword ?? true)

        // App Lock stats
        setIsAppLockEnabled(!!(profile as any).appLockEnabled)
        setHasPinSet(!!(profile as any).appLockPinHash)
      } catch (error) {
        console.error('Failed to load profile:', error)
        toast({
          title: 'Error',
          description: 'Unable to load your personal information',
          variant: 'destructive',
        })
      } finally {
        setIsLoadingProfile(false)
      }
    }

    loadProfile()
  }, [toast])

  const handleAvatarUpload = async (file: File) => {
    setSuccessMessage('')
    setIsUploadingAvatar(true)
    try {
      const avatarResponse = await userApi.uploadAvatar(file)
      const nextAvatar =
        avatarResponse.user?.avatarUrl ||
        avatarResponse.imageUrl ||
        ''

      setAvatar(nextAvatar)

      showSuccess('Avatar updated successfully.')
    } catch (avatarError) {
      console.error('Avatar upload error:', avatarError)
      toast({
        title: 'Error',
        description: avatarError instanceof Error ? avatarError.message : 'Unable to update avatar',
        variant: 'destructive',
      })
    } finally {
      setIsUploadingAvatar(false)
    }
  }

  const handleAvatarRemove = async () => {
    setSuccessMessage('')
    setIsUploadingAvatar(true)
    try {
      const response = await userApi.removeAvatar()
      setAvatar(response.user.avatarUrl || '')
      showSuccess('Avatar removed.')
    } catch (error) {
      console.error('Avatar removal error:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Unable to remove avatar',
        variant: 'destructive',
      })
    } finally {
      setIsUploadingAvatar(false)
    }
  }

  const handlePersonalInfoSave = async (e: FormEvent) => {
    e.preventDefault()
    setSuccessMessage('')
    setIsLoading(true)

    try {
      // Then update profile info
      try {
        const response = await userApi.updateProfile({
          fullName: name,
          age: age ? parseInt(age) : undefined,
          heightCm: height ? parseInt(height) : undefined,
          weight: weight ? parseFloat(weight) : undefined,
        })

        setAvatar((prev) => response.user.avatarUrl || prev || '')

        showSuccess('Personal information updated successfully.')
        setShowEditModal(false)
      } catch (profileError) {
        console.error('Profile update error:', profileError)
        toast({
          title: 'Error',
          description: profileError instanceof Error ? profileError.message : 'Unable to update personal information',
          variant: 'destructive',
        })
      }
    } finally {
      setIsLoading(false)
    }
  }

  const validatePasswordStrength = (password: string): boolean => {
    // Must contain uppercase letters and special characters, at least 8 chars
    const passwordRegex = /^(?=.*[A-Z])(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])(?=.{8,})/
    return passwordRegex.test(password)
  }

  const handlePasswordChange = async (e: FormEvent) => {
    e.preventDefault()
    setPasswordError('')
    setSuccessMessage('')

    if (!newPassword) {
      setPasswordError('Please enter a new password')
      return
    }

    if (!validatePasswordStrength(newPassword)) {
      setPasswordError(
        'Password must be at least 8 characters, including uppercase and special characters'
      )
      return
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New password does not match')
      return
    }

    setIsLoading(true)
    try {
      await userApi.changePassword({
        currentPassword: currentPassword || '',
        newPassword,
      })

      showSuccess(hasPassword ? 'Password changed successfully.' : 'Password set successfully.')

      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setPasswordError('')
      setHasPassword(true)
      setIsSettingPassword(false)
    } catch (error) {
      console.error('Password change error:', error)
      const errorMsg = error instanceof Error ? error.message : 'Unable to change password'
      setPasswordError(errorMsg)
      toast({
        title: 'Error',
        description: errorMsg,
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handlePinSetup = async (e: FormEvent) => {
    e.preventDefault()
    const pin = pinDigits.join('')
    const confirmPin = confirmPinDigits.join('')

    if (pin !== confirmPin) {
      toast({
        title: 'Error',
        description: 'PIN does not match',
        variant: 'destructive',
      })
      return
    }
    if (pin.length !== 6) {
      toast({
        title: 'Error',
        description: 'PIN must be 6 digits',
        variant: 'destructive',
      })
      return
    }

    setIsLoading(true)
    try {
      await userApi.setAppLockPin(pin)
      setHasPinSet(true)
      setIsAppLockEnabled(true)
      setShowPinForm(false)
      setPinDigits(Array(6).fill(''))
      setConfirmPinDigits(Array(6).fill(''))

      toast({
        title: 'Success',
        description: 'Your PIN has been set successfully!',
        variant: 'default',
      })
    } catch (error) {
      console.error('Set PIN error:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Unable to set PIN',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleToggleAppLock = async (enabled: boolean) => {
    setIsLoading(true)
    try {
      await userApi.toggleAppLock(enabled)
      setIsAppLockEnabled(enabled)
      toast({
        title: 'Success',
        description: `App lock is now ${enabled ? 'enabled' : 'disabled'}`,
      })
    } catch (error) {
      console.error('Toggle App Lock error:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Unable to change lock status',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
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

  if (isLoadingProfile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your profile...</p>
        </div>
      </div>
    )
  }

  return (
    <DashboardLayout title="My Profile">
      <div className="flex-1 flex flex-col">
        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-0">
          {successMessage && (
            <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
              {successMessage}
            </div>
          )}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Avatar & Member Info Sidebar */}
            <div className="lg:col-span-1">
              <Card className="bg-white rounded-2xl shadow-lg border-border flex flex-col items-center p-6">
                <AvatarUpload
                  currentAvatar={avatar}
                  onAvatarChange={handleAvatarUpload}
                  onRemove={handleAvatarRemove}
                  isLoading={isUploadingAvatar}
                />
                <div className="mt-6 pt-4 border-t border-border w-full text-center">
                  <p className="text-sm font-semibold text-primary mb-1">Member Since</p>
                  <p className="text-sm text-muted-foreground">January 2024</p>
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
                      className="data-[state=active]:bg-white data-[state=active]:text-primary hover:bg-white/50 data-[state=active]:shadow-sm"
                    >
                      Personal Info
                    </TabsTrigger>
                    <TabsTrigger
                      value="password"
                      className="data-[state=active]:bg-white data-[state=active]:text-primary hover:bg-white/50 data-[state=active]:shadow-sm"
                    >
                      Password
                    </TabsTrigger>
                    <TabsTrigger
                      value="security"
                      className="data-[state=active]:bg-white data-[state=active]:text-primary hover:bg-white/50 data-[state=active]:shadow-sm"
                    >
                      Security
                    </TabsTrigger>
                  </TabsList>

                  {/* Personal Info */}
                  <TabsContent value="personal" className="mt-6 space-y-6">
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-muted-foreground">Full Name</p>
                          <p className="text-base font-semibold text-foreground">{name || 'Not provided'}</p>
                        </div>
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-muted-foreground">Email</p>
                          <p className="text-base font-semibold text-foreground">{email}</p>
                        </div>
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-muted-foreground">Age</p>
                          <p className="text-base font-semibold text-foreground">{age || 'Not provided'}</p>
                        </div>
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-muted-foreground">Height (cm)</p>
                          <p className="text-base font-semibold text-foreground">{height || 'Not provided'}</p>
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <p className="text-sm font-medium text-muted-foreground">Weight (kg)</p>
                          <p className="text-base font-semibold text-foreground">{weight || 'Not provided'}</p>
                        </div>
                      </div>

                      <Button
                        onClick={() => setShowEditModal(true)}
                        className="w-full md:w-auto h-11 bg-primary hover:bg-primary/90"
                      >
                        Update Profile
                      </Button>
                    </div>
                  </TabsContent>

                  {/* Password Change */}
                  <TabsContent value="password" className="mt-6 space-y-6">
                    {!hasPassword && !isSettingPassword ? (
                      <div className="space-y-4">
                        <div className="p-4 bg-secondary/20 border border-border rounded-lg">
                          <p className="text-sm text-foreground">
                            You currently do not have a password set. You can set a password to log in with your email in addition to Google.
                          </p>
                        </div>
                        <Button
                          type="button"
                          onClick={() => setIsSettingPassword(true)}
                          className="w-full md:w-auto h-11 bg-primary hover:bg-primary/90"
                        >
                          Set Password
                        </Button>
                      </div>
                    ) : (
                      <form onSubmit={handlePasswordChange} className="space-y-5">
                        {passwordError && (
                          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-sm text-red-700">{passwordError}</p>
                          </div>
                        )}

                        {hasPassword && (
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
                                required
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
                        )}

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
                            required
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Must contain at least 8 characters, uppercase letters, and special characters
                          </p>
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
                            required
                          />
                        </div>

                        <div className="flex gap-4">
                          {!hasPassword && (
                            <Button
                              type="button"
                              onClick={() => {
                                setIsSettingPassword(false)
                                setNewPassword('')
                                setConfirmPassword('')
                                setPasswordError('')
                              }}
                              variant="outline"
                              className="flex-1 h-11"
                              disabled={isLoading}
                            >
                              Cancel
                            </Button>
                          )}
                          <Button
                            type="submit"
                            disabled={isLoading}
                            className={`${!hasPassword ? 'flex-1' : 'w-full'} h-11 bg-primary hover:bg-primary/90`}
                          >
                            {isLoading ? 'Processing...' : hasPassword ? 'Change Password' : 'Save Password'}
                          </Button>
                        </div>
                      </form>
                    )}
                  </TabsContent>

                  {/* Security / PIN Setup */}
                  <TabsContent value="security" className="mt-6 space-y-6">
                    <div className="bg-secondary/40 border border-border rounded-lg p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex gap-3">
                          <Lock className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                          <div>
                            <h4 className="font-semibold text-primary mb-1.5">App Lock PIN</h4>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                              Set a 4-digit PIN to protect your journal data when using the web browser.
                            </p>
                          </div>
                        </div>
                        {hasPinSet && (
                          <div className="flex items-center space-x-2">
                            <Button
                              variant={isAppLockEnabled ? "default" : "outline"}
                              size="sm"
                              onClick={() => handleToggleAppLock(!isAppLockEnabled)}
                              disabled={isLoading}
                            >
                              {isAppLockEnabled ? 'Disable Lock' : 'Enable Lock'}
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>

                    {!showPinForm ? (
                      <Button
                        onClick={() => setShowPinForm(true)}
                        className="w-full h-11 bg-primary hover:bg-primary/90 gap-2"
                        disabled={isLoading}
                      >
                        <Lock size={18} />
                        {hasPinSet ? 'Change App Lock PIN' : 'Set App Lock PIN'}
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
                            disabled={isLoading}
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
                            {isLoading ? 'Setting...' : hasPinSet ? 'Update PIN' : 'Set PIN'}
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

      {/* Edit Profile Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <Card className="w-full max-w-2xl shadow-2xl bg-white overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-border/50 flex justify-between items-center bg-secondary/10">
              <h2 className="text-2xl font-bold text-primary">Update Profile</h2>
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="text-muted-foreground hover:text-foreground p-2 rounded-full hover:bg-black/5 transition-colors"
                aria-label="Close modal"
              >
                <X size={24} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto">
              <form id="edit-profile-form" onSubmit={handlePersonalInfoSave} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-primary font-medium">
                    Full Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
                    className="h-11 border-2 focus:border-primary transition-colors"
                    placeholder="Enter your full name"
                    required
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
                    className="h-11 bg-muted/50 cursor-not-allowed"
                    disabled
                  />
                  <p className="text-xs text-muted-foreground mt-1">Email cannot be changed.</p>
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
                    className="h-11 border-2 focus:border-primary transition-colors"
                    placeholder="e.g. 25"
                    min="0"
                    max="120"
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
                    className="h-11 border-2 focus:border-primary transition-colors"
                    placeholder="e.g. 175"
                    min="0"
                    max="300"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="weight" className="text-primary font-medium">
                    Weight (kg)
                  </Label>
                  <Input
                    id="weight"
                    type="number"
                    step="0.1"
                    value={weight}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setWeight(e.target.value)}
                    className="h-11 border-2 focus:border-primary transition-colors"
                    placeholder="e.g. 65.5"
                    min="0"
                    max="500"
                  />
                </div>
              </form>
            </div>
            <div className="p-6 border-t border-border/50 bg-secondary/5 flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowEditModal(false)}
                className="h-11 px-6 font-medium"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                form="edit-profile-form"
                disabled={isLoading}
                className="h-11 px-8 bg-primary hover:bg-primary/90 text-white font-medium shadow-md hover:shadow-lg transition-all"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Saving...
                  </div>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </DashboardLayout>
  )
}

export default UserProfilePage