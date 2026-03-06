import React, { useEffect, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { Button } from '../../../components/ui/Button'
import { Input } from '../../../components/ui/Input'
import { Label } from '../../../components/ui/Label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/Tabs'
import AvatarUpload from '../../../components/profile/AvatarUpload'
import { Eye, EyeOff, Lock, Copy, Check, AlertCircle, Menu, X } from 'lucide-react'
import DashboardSidebar from '../../../components/layout/DashboardSideBar'
import { Card } from '../../../components/ui/Card'
import { userApi } from '../../../api/userApi'
import { useToast } from '../../../hooks/use-toast'

const AdminProfilePage: React.FC = () => {
  const { toast } = useToast()
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false)
  const [activeTab, setActiveTab] = useState<'personal' | 'password' | 'security' | 'recovery'>('personal')
  const [isLoadingProfile, setIsLoadingProfile] = useState<boolean>(true)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState<boolean>(false)
  const [isRefreshingCodes, setIsRefreshingCodes] = useState<boolean>(false)
  const [successMessage, setSuccessMessage] = useState<string>('')
  const [copiedCode, setCopiedCode] = useState<number | null>(null)

  // Personal Info
  const [name, setName] = useState<string>('')
  const [email, setEmail] = useState<string>('')
  const [role, setRole] = useState<string>('System Administrator')
  const [avatar, setAvatar] = useState<string>('')

  // Password
  const [currentPassword, setCurrentPassword] = useState<string>('')
  const [newPassword, setNewPassword] = useState<string>('')
  const [confirmPassword, setConfirmPassword] = useState<string>('')
  const [recoveryCodeInput, setRecoveryCodeInput] = useState<string>('')
  const [showPasswords, setShowPasswords] = useState<boolean>(false)
  const [passwordError, setPasswordError] = useState<string>('')

  // PIN
  const [showPinForm, setShowPinForm] = useState<boolean>(false)
  const [pinDigits, setPinDigits] = useState<string[]>(Array(6).fill(''))
  const [confirmPinDigits, setConfirmPinDigits] = useState<string[]>(Array(6).fill(''))

  // Recovery Codes
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([])

  const showSuccess = (message: string) => {
    setSuccessMessage(message)
    console.log(`[PROFILE_SUCCESS] ${message}`)
  }

  const loadProfile = async () => {
    try {
      setIsLoadingProfile(true)
      const profile = await userApi.getProfile()
      setName(profile.fullName || '')
      setEmail(profile.email || '')
      setAvatar(profile.avatarUrl || '')

      if (profile.role === 'admin') {
        setRole('System Administrator')
      } else if (profile.role) {
        setRole(profile.role)
      }
    } catch (error) {
      console.error('Failed to load admin profile:', error)
      toast({
        title: 'Lỗi',
        description: 'Không thể tải thông tin hồ sơ admin',
        variant: 'destructive',
      })
    } finally {
      setIsLoadingProfile(false)
    }
  }

  const loadRecoveryCodes = async () => {
    try {
      const response = await userApi.getAdminRecoveryCodes()
      setRecoveryCodes(response.codes || [])
    } catch (error) {
      console.error('Failed to load recovery codes:', error)
      toast({
        title: 'Lỗi',
        description: error instanceof Error ? error.message : 'Không thể tải recovery codes',
        variant: 'destructive',
      })
    }
  }

  useEffect(() => {
    void loadProfile()
    void loadRecoveryCodes()
  }, [])

  const handleAvatarUpload = async (file: File) => {
    setSuccessMessage('')
    setIsUploadingAvatar(true)
    try {
      const avatarResponse = await userApi.uploadAvatar(file)
      const nextAvatar = avatarResponse.user?.avatarUrl || avatarResponse.imageUrl || ''
      setAvatar(nextAvatar)
      showSuccess('Avatar đã được cập nhật thành công.')
    } catch (avatarError) {
      console.error('Admin avatar upload error:', avatarError)
      toast({
        title: 'Lỗi',
        description: avatarError instanceof Error ? avatarError.message : 'Không thể cập nhật avatar',
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
      const response = await userApi.updateProfile({ fullName: name })
      setAvatar((prev) => response.user.avatarUrl || prev || '')
      showSuccess('Thông tin hồ sơ đã được cập nhật thành công.')
    } catch (profileError) {
      console.error('Admin profile update error:', profileError)
      toast({
        title: 'Lỗi',
        description: profileError instanceof Error ? profileError.message : 'Không thể cập nhật hồ sơ admin',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const validatePasswordStrength = (password: string): boolean => {
    const passwordRegex = /^(?=.*[A-Z])(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])(?=.{8,})/
    return passwordRegex.test(password)
  }

  const handlePasswordChange = async (e: FormEvent) => {
    e.preventDefault()
    setPasswordError('')
    setSuccessMessage('')

    if (!recoveryCodeInput.trim()) {
      setPasswordError('Vui lòng nhập một recovery code')
      return
    }

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
    const normalizedRecoveryCode = recoveryCodeInput.trim().toUpperCase()

    try {
      await userApi.changePassword({
        currentPassword,
        newPassword,
        recoveryCode: normalizedRecoveryCode,
      })

      setRecoveryCodes((prev) =>
        prev.filter((code) => code.toUpperCase() !== normalizedRecoveryCode)
      )

      showSuccess('Mật khẩu đã được thay đổi thành công.')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setRecoveryCodeInput('')
      setPasswordError('')
    } catch (error) {
      console.error('Admin password change error:', error)
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

  const handleRegenerateRecoveryCodes = async () => {
    setSuccessMessage('')
    setIsRefreshingCodes(true)
    try {
      const response = await userApi.regenerateAdminRecoveryCodes()
      setRecoveryCodes(response.codes || [])
      showSuccess('Đã tạo mới 10 recovery codes thành công.')
    } catch (error) {
      console.error('Regenerate recovery codes error:', error)
      toast({
        title: 'Lỗi',
        description: error instanceof Error ? error.message : 'Không thể tạo lại recovery codes',
        variant: 'destructive',
      })
    } finally {
      setIsRefreshingCodes(false)
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
    console.log('Setting PIN:', pin)
    await new Promise((resolve) => setTimeout(resolve, 1200))
    setIsLoading(false)
    setShowPinForm(false)
    setPinDigits(Array(6).fill(''))
    setConfirmPinDigits(Array(6).fill(''))

    toast({
      title: 'Thành công',
      description: 'Mã PIN của bạn đã được đặt thành công!',
      variant: 'default',
    })
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

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text)
    setCopiedCode(index)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  const handleDownloadCodes = () => {
    if (!recoveryCodes.length) return
    const content = recoveryCodes.join('\n')
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'recovery-codes.txt'
    link.click()
    URL.revokeObjectURL(url)
  }

  if (isLoadingProfile) {
    return (
      <div className="flex min-h-screen bg-background">
        <div className={`fixed inset-y-0 left-0 z-30 lg:static lg:block`}>
          <DashboardSidebar userType="admin" onClose={() => setSidebarOpen(false)} />
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
        <DashboardSidebar userType="admin" onClose={() => setSidebarOpen(false)} />
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
            <h1 className="text-2xl font-bold text-primary">Admin Profile</h1>

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
            {/* Avatar & Role Sidebar */}
            <div className="lg:col-span-1">
              <Card className="bg-white rounded-2xl shadow-lg border-border flex flex-col items-center p-6">
                <AvatarUpload
                  currentAvatar={avatar}
                  onAvatarChange={handleAvatarUpload}
                  isLoading={isUploadingAvatar}
                />
                <div className="mt-6 pt-4 border-t border-border w-full text-center">
                  <p className="text-sm font-semibold text-primary mb-1">Role</p>
                  <p className="text-sm text-muted-foreground">{role}</p>
                </div>
              </Card>
            </div>

            {/* Main Tabs Content */}
            <div className="lg:col-span-3">
              <Card className="bg-white rounded-2xl shadow-lg border-border p-6">
                <Tabs
                  value={activeTab}
                  onValueChange={(value) =>
                    setActiveTab(value as 'personal' | 'password' | 'security' | 'recovery')
                  }
                >
                  <TabsList className="grid w-full grid-cols-4 bg-secondary/50 rounded-lg">
                    <TabsTrigger
                      value="personal"
                      className="data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-sm text-xs sm:text-sm"
                    >
                      Personal
                    </TabsTrigger>
                    <TabsTrigger
                      value="password"
                      className="data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-sm text-xs sm:text-sm"
                    >
                      Password
                    </TabsTrigger>
                    <TabsTrigger
                      value="security"
                      className="data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-sm text-xs sm:text-sm"
                    >
                      PIN
                    </TabsTrigger>
                    <TabsTrigger
                      value="recovery"
                      className="data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-sm text-xs sm:text-sm"
                    >
                      Recovery
                    </TabsTrigger>
                  </TabsList>

                  {/* Personal Info */}
                  <TabsContent value="personal" className="mt-6 space-y-6">
                    <form onSubmit={handlePersonalInfoSave} className="space-y-5">
                      <div className="space-y-2">
                        <Label htmlFor="admin-name" className="text-primary font-medium">
                          Full Name
                        </Label>
                        <Input
                          id="admin-name"
                          value={name}
                          onChange={(e: ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
                          className="h-11"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="admin-email" className="text-primary font-medium">
                          Email
                        </Label>
                        <Input
                          id="admin-email"
                          type="email"
                          value={email}
                          onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                          className="h-11"
                          disabled
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="admin-role" className="text-primary font-medium">
                          Role
                        </Label>
                        <Input
                          id="admin-role"
                          value={role}
                          className="h-11"
                          disabled
                        />
                      </div>

                      <Button
                        type="submit"
                        disabled={isLoading}
                        className="w-full h-11 bg-primary hover:bg-primary/90"
                      >
                        {isLoading ? 'Saving...' : 'Save Changes'}
                      </Button>
                    </form>
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
                        <Label htmlFor="admin-recovery-code" className="text-primary font-medium">
                          Recovery Code
                        </Label>
                        <Input
                          id="admin-recovery-code"
                          value={recoveryCodeInput}
                          onChange={(e: ChangeEvent<HTMLInputElement>) => setRecoveryCodeInput(e.target.value.toUpperCase())}
                          className="h-11 font-mono uppercase"
                          placeholder="HG-2026-A1B2C3"
                          required
                        />
                        <p className="text-xs text-muted-foreground">
                          Còn lại {recoveryCodes.length} mã có thể sử dụng.
                        </p>
                      </div>

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
                        disabled={isLoading || !recoveryCodes.length}
                        className="w-full h-11 bg-primary hover:bg-primary/90"
                      >
                        {isLoading ? 'Updating...' : 'Change Password'}
                      </Button>
                    </form>
                  </TabsContent>

                  {/* PIN Setup */}
                  <TabsContent value="security" className="mt-6 space-y-6">
                    <div className="bg-secondary/40 border border-border rounded-lg p-5">
                      <div className="flex items-start gap-3">
                        <Lock className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                        <div>
                          <h4 className="font-semibold text-primary mb-1.5">Admin PIN Protection</h4>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            Add an extra layer of security with a 6-digit PIN required for sensitive admin actions.
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
                        Set Admin PIN
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
                          >
                            Cancel
                          </Button>
                          <Button
                            type="submit"
                            disabled={
                              isLoading ||
                              pinDigits.some((d) => !d) ||
                              confirmPinDigits.some((d) => !d)
                            }
                            className="flex-1 h-11 bg-primary hover:bg-primary/90"
                          >
                            {isLoading ? 'Setting...' : 'Set PIN'}
                          </Button>
                        </div>
                      </form>
                    )}
                  </TabsContent>

                  {/* Recovery Codes */}
                  <TabsContent value="recovery" className="mt-6 space-y-6">
                    <div className="bg-accent/10 border border-accent/30 rounded-lg p-5">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-accent mt-0.5" />
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          Admin uses one recovery code for each password change. Used code is removed and cannot be reused.
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <Button
                        onClick={handleRegenerateRecoveryCodes}
                        disabled={isRefreshingCodes}
                        className="h-11 bg-primary hover:bg-primary/90"
                      >
                        {isRefreshingCodes ? 'Generating...' : 'Regenerate 10 Codes'}
                      </Button>
                      <Button
                        variant="outline"
                        className="h-11 border-primary text-primary hover:bg-primary/10"
                        onClick={handleDownloadCodes}
                        disabled={!recoveryCodes.length}
                      >
                        Download All Codes
                      </Button>
                    </div>

                    {!recoveryCodes.length ? (
                      <div className="rounded-lg border border-border p-4 text-sm text-muted-foreground">
                        Chưa có recovery code nào. Hãy bấm "Regenerate 10 Codes" để tạo mã.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {recoveryCodes.map((code, index) => (
                          <div
                            key={code}
                            className="flex items-center justify-between bg-secondary/30 border border-border rounded-lg px-4 py-3 hover:bg-secondary/50 transition-colors"
                          >
                            <code className="font-mono text-sm font-semibold text-primary tracking-wide">
                              {code}
                            </code>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => copyToClipboard(code, index)}
                              aria-label="Copy recovery code"
                            >
                              {copiedCode === index ? (
                                <Check className="h-5 w-5 text-green-600" />
                              ) : (
                                <Copy className="h-5 w-5" />
                              )}
                            </Button>
                          </div>
                        ))}
                      </div>
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

export default AdminProfilePage
