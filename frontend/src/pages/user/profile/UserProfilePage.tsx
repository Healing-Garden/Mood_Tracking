import React, { useState, useEffect } from 'react'
import type { FormEvent, ChangeEvent } from 'react'
import { Button } from '../../../components/ui/Button'
import { Input } from '../../../components/ui/Input'
import { Label } from '../../../components/ui/Label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/Tabs'
import AvatarUpload from '../../../components/profile/AvatarUpload'
import { Eye, EyeOff, Lock, Menu, X } from 'lucide-react'
import DashboardSidebar from '../../../components/layout/DashboardSideBar'
import { Card } from '../../../components/ui/Card'
import { useToast } from '../../../hooks/use-toast'
import { userApi } from '../../../api/userApi'

const UserProfilePage: React.FC = () => {
  const { toast } = useToast()
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false)
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

        // App Lock stats
        setIsAppLockEnabled(!!(profile as any).appLockEnabled)
        setHasPinSet(!!(profile as any).appLockPinHash)
      } catch (error) {
        console.error('Failed to load profile:', error)
        toast({
          title: 'Lỗi',
          description: 'Không thể tải thông tin cá nhân của bạn',
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

      showSuccess('Avatar đã được cập nhật thành công.')
    } catch (avatarError) {
      console.error('Avatar upload error:', avatarError)
      toast({
        title: 'Lỗi',
        description: avatarError instanceof Error ? avatarError.message : 'Không thể cập nhật avatar',
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
      showSuccess('Avatar đã được gỡ bỏ.')
    } catch (error) {
      console.error('Avatar removal error:', error)
      toast({
        title: 'Lỗi',
        description: error instanceof Error ? error.message : 'Không thể gỡ bỏ avatar',
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

        showSuccess('Thông tin cá nhân đã được cập nhật thành công.')
        setShowEditModal(false)
      } catch (profileError) {
        console.error('Profile update error:', profileError)
        toast({
          title: 'Lỗi',
          description: profileError instanceof Error ? profileError.message : 'Không thể cập nhật thông tin cá nhân',
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
      setPasswordError('Vui lòng nhập mật khẩu mới')
      return
    }

    if (!validatePasswordStrength(newPassword)) {
      setPasswordError(
        'Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ hoa và ký tự đặc biệt'
      )
      return
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Mật khẩu mới không khớp')
      return
    }

    setIsLoading(true)
    try {
      await userApi.changePassword({
        currentPassword,
        newPassword,
      })

      showSuccess('Mật khẩu đã được thay đổi thành công.')

      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setPasswordError('')
    } catch (error) {
      console.error('Password change error:', error)
      const errorMsg = error instanceof Error ? error.message : 'Không thể thay đổi mật khẩu'
      setPasswordError(errorMsg)
      toast({
        title: 'Lỗi',
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
        title: 'Lỗi',
        description: 'Mã PIN không khớp',
        variant: 'destructive',
      })
      return
    }
    if (pin.length !== 6) {
      toast({
        title: 'Lỗi',
        description: 'Mã PIN phải có 6 chữ số',
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
        title: 'Thành công',
        description: 'Mã PIN của bạn đã được đặt thành công!',
        variant: 'default',
      })
    } catch (error) {
      console.error('Set PIN error:', error)
      toast({
        title: 'Lỗi',
        description: error instanceof Error ? error.message : 'Không thể đặt mã PIN',
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
        title: 'Thành công',
        description: `Đã ${enabled ? 'bật' : 'tắt'} khóa ứng dụng`,
      })
    } catch (error) {
      console.error('Toggle App Lock error:', error)
      toast({
        title: 'Lỗi',
        description: error instanceof Error ? error.message : 'Không thể thay đổi trạng thái khóa',
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
      <div className="flex min-h-screen bg-background">
        <div className={`fixed inset-y-0 left-0 z-30 lg:static lg:block`}>
          <DashboardSidebar userType="user" onClose={() => setSidebarOpen(false)} />
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading your profile...</p>
          </div>
        </div>
      </div>
    )
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
                    <form onSubmit={handlePasswordChange} className="space-y-5">
                      {passwordError && (
                        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                          <p className="text-sm text-red-700">{passwordError}</p>
                        </div>
                      )}

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

                      <Button
                        type="submit"
                        disabled={isLoading}
                        className="w-full h-11 bg-primary hover:bg-primary/90"
                      >
                        {isLoading ? 'Updating...' : 'Change Password'}
                      </Button>
                    </form>
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
    </div>
  )
}

export default UserProfilePage
