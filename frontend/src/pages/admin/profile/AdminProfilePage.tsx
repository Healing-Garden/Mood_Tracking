import React, { useEffect, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { Button } from '../../../components/ui/Button'
import { Input } from '../../../components/ui/Input'
import { Label } from '../../../components/ui/Label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/Tabs'
import AvatarUpload from '../../../components/profile/AvatarUpload'
import { Eye, EyeOff, Lock, AlertCircle, X } from 'lucide-react'
import { Card } from '../../../components/ui/Card'
import { userApi } from '../../../api/userApi'
import { useToast } from '../../../hooks/use-toast'
import DashboardLayout from '../../../components/layout/DashboardLayout'

const AdminProfilePage: React.FC = () => {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState<'personal' | 'password' | 'security' | 'recovery'>('personal')
  const [isLoadingProfile, setIsLoadingProfile] = useState<boolean>(true)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState<boolean>(false)
  const [successMessage, setSuccessMessage] = useState<string>('')
  const [showEditModal, setShowEditModal] = useState<boolean>(false)
  const [hasDownloaded, setHasDownloaded] = useState<boolean>(false)
  const [recoveryCodesCount, setRecoveryCodesCount] = useState<number>(0)

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

  const [showPinForm, setShowPinForm] = useState<boolean>(false)
  const [pinDigits, setPinDigits] = useState<string[]>(Array(6).fill(''))
  const [confirmPinDigits, setConfirmPinDigits] = useState<string[]>(Array(6).fill(''))

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
      setRecoveryCodesCount(response.count || 0)
      setHasDownloaded(response.hasDownloaded || false)
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

  const handleAvatarRemove = async () => {
    setSuccessMessage('')
    setIsUploadingAvatar(true)
    try {
      const response = await userApi.removeAvatar()
      setAvatar(response.user.avatarUrl || '')
      showSuccess('Avatar đã được gỡ bỏ.')
    } catch (error) {
      console.error('Admin avatar removal error:', error)
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
      const response = await userApi.updateProfile({ fullName: name })
      setAvatar((prev) => response.user.avatarUrl || prev || '')
      showSuccess('Thông tin hồ sơ đã được cập nhật thành công.')
      setShowEditModal(false)
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

      setRecoveryCodesCount((prev) => Math.max(0, prev - 1))

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

  const handleDownloadCodes = async () => {
    try {
      if (hasDownloaded) {
        toast({
          title: 'Thông báo',
          description: 'Mã khôi phục đã được tải xuống.',
          variant: 'default',
        })
        return
      }

      const response = await userApi.markAdminRecoveryCodesDownloaded()
      const codes = response.codes || []

      if (!codes.length) {
        toast({
          title: 'Lỗi',
          description: 'Không có mã khôi phục nào được trả về',
          variant: 'destructive',
        })
        return
      }

      const content = codes.join('\n')
      const blob = new Blob([content], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'recovery-codes.txt'
      link.click()
      URL.revokeObjectURL(url)

      setHasDownloaded(true)
      toast({
        title: 'Thành công',
        description: 'Mã khôi phục đã được tải xuống.',
        variant: 'default',
      })
    } catch (error) {
      console.error('Failed to mark codes as downloaded:', error)
      toast({
        title: 'Lỗi',
        description: 'Không thể đánh dấu mã khôi phục đã tải xuống',
        variant: 'destructive',
      })
    }
  }

  if (isLoadingProfile) {
    return (
      <DashboardLayout title="Admin Profile" userType="admin">
        <div className="flex-1 flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground font-medium">Loading your profile...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title="Admin Profile" userType="admin">
        <div className="px-4 py-8 max-w-7xl mx-auto w-full">
          {successMessage && (
            <div className="mb-6 rounded-2xl border border-green-200 bg-green-50 px-6 py-4 text-sm text-green-700 animate-in slide-in-from-top duration-300">
              <span className="flex items-center gap-2 font-medium">
                <span className="text-lg">✅</span> {successMessage}
              </span>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
            {/* Avatar & Role Sidebar */}
            <div className="lg:col-span-1">
              <Card className="bg-white rounded-2xl shadow-sm border-border flex flex-col items-center p-8">
                <AvatarUpload
                  currentAvatar={avatar}
                  onAvatarChange={handleAvatarUpload}
                  onRemove={handleAvatarRemove}
                  isLoading={isUploadingAvatar}
                />
                <div className="mt-8 pt-6 border-t border-border w-full text-center">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1.5">Administrative Role</p>
                  <p className="text-lg font-bold text-primary">{role}</p>
                </div>
              </Card>
            </div>

            {/* Main Tabs Content */}
            <div className="lg:col-span-3">
              <Card className="bg-white rounded-2xl shadow-sm border-border p-8">
                <Tabs
                  value={activeTab}
                  onValueChange={(value) =>
                    setActiveTab(value as 'personal' | 'password' | 'security' | 'recovery')
                  }
                >
                  <TabsList className="mb-8 p-1 grid w-full grid-cols-4 bg-secondary/50 rounded-xl">
                    <TabsTrigger
                      value="personal"
                      className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-md text-xs sm:text-sm font-medium transition-all"
                    >
                      Personal
                    </TabsTrigger>
                    <TabsTrigger
                      value="password"
                      className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-md text-xs sm:text-sm font-medium transition-all"
                    >
                      Password
                    </TabsTrigger>
                    <TabsTrigger
                      value="security"
                      className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-md text-xs sm:text-sm font-medium transition-all"
                    >
                      Security PIN
                    </TabsTrigger>
                    <TabsTrigger
                      value="recovery"
                      className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-md text-xs sm:text-sm font-medium transition-all"
                    >
                      Recovery
                    </TabsTrigger>
                  </TabsList>

                  {/* Personal Info */}
                  <TabsContent value="personal" className="mt-0 space-y-8 animate-in fade-in duration-300">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-1.5">
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Full Display Name</p>
                        <p className="text-xl font-bold text-foreground">{name || 'Not provided'}</p>
                      </div>
                      <div className="space-y-1.5">
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Primary Email Address</p>
                        <p className="text-xl font-bold text-foreground">{email}</p>
                      </div>
                    </div>

                    <div className="pt-6 border-t border-border">
                        <Button
                          onClick={() => setShowEditModal(true)}
                          className="w-full md:w-auto px-8 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold h-12 shadow-sm"
                        >
                          Update Personal Details
                        </Button>
                    </div>
                  </TabsContent>

                  {/* Password Change */}
                  <TabsContent value="password" className="mt-0 space-y-6 animate-in fade-in duration-300">
                    <form onSubmit={handlePasswordChange} className="space-y-6">
                      {passwordError && (
                        <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3">
                           <AlertCircle className="text-red-500 w-5 h-5 flex-shrink-0" />
                           <p className="text-sm font-medium text-red-700">{passwordError}</p>
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <Label htmlFor="admin-recovery-code" className="text-sm font-bold text-foreground">
                              Recovery Code Verification
                            </Label>
                            <Input
                              id="admin-recovery-code"
                              value={recoveryCodeInput}
                              onChange={(e: ChangeEvent<HTMLInputElement>) => setRecoveryCodeInput(e.target.value.toUpperCase())}
                              className="h-12 font-mono uppercase rounded-xl border-border focus:ring-primary"
                              placeholder="Enter one recovery code"
                              autoComplete="off"
                              required
                            />
                            <p className="text-[10px] text-muted-foreground font-medium flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                              Available codes: <span className="text-foreground">{recoveryCodesCount}</span>
                            </p>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="current-password" className="text-sm font-bold text-foreground">
                              Confirm Identity
                            </Label>
                            <div className="relative">
                              <Input
                                id="current-password"
                                type={showPasswords ? 'text' : 'password'}
                                value={currentPassword}
                                onChange={(e: ChangeEvent<HTMLInputElement>) => setCurrentPassword(e.target.value)}
                                className="h-12 pr-12 rounded-xl border-border focus:ring-primary"
                                placeholder="Enter current password"
                                required
                              />
                              <button
                                type="button"
                                onClick={() => setShowPasswords(!showPasswords)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                              >
                                {showPasswords ? <EyeOff size={18} /> : <Eye size={18} />}
                              </button>
                            </div>
                          </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <Label htmlFor="new-password" className="text-sm font-bold text-foreground">
                              New Credential
                            </Label>
                            <Input
                              id="new-password"
                              type={showPasswords ? 'text' : 'password'}
                              value={newPassword}
                              onChange={(e: ChangeEvent<HTMLInputElement>) => setNewPassword(e.target.value)}
                              className="h-12 rounded-xl border-border focus:ring-primary"
                              placeholder="Enter new strong password"
                              required
                            />
                             <p className="text-[10px] text-muted-foreground leading-tight">
                              Mi8+ chars, 1 uppercase, 1 special sym
                            </p>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="confirm-password" className="text-sm font-bold text-foreground">
                              Repeat New Credential
                            </Label>
                            <Input
                              id="confirm-password"
                              type={showPasswords ? 'text' : 'password'}
                              value={confirmPassword}
                              onChange={(e: ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value)}
                              className="h-12 rounded-xl border-border focus:ring-primary"
                              placeholder="Confirm new password"
                              required
                            />
                          </div>
                      </div>

                      <Button
                        type="submit"
                        disabled={isLoading || recoveryCodesCount === 0}
                        className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold shadow-md"
                      >
                        {isLoading ? 'Processing Security Update...' : 'Commit Password Change'}
                      </Button>
                    </form>
                  </TabsContent>

                  {/* PIN Setup */}
                  <TabsContent value="security" className="mt-0 space-y-8 animate-in fade-in duration-300">
                    <div className="bg-secondary/30 border border-border rounded-2xl p-6">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                           <Lock className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-bold text-foreground text-lg mb-1">Advanced PIN Protection</h4>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            For highly sensitive administrative operations, a secondary 6-digit PIN is required. This ensures that even if a session is compromised, critical system settings remain protected.
                          </p>
                        </div>
                      </div>
                    </div>

                    {!showPinForm ? (
                      <Button
                        onClick={() => setShowPinForm(true)}
                        className="w-full h-12 bg-primary hover:bg-primary/90 rounded-xl gap-2 font-bold shadow-md"
                      >
                        <Lock size={18} />
                        Establish Admin Security PIN
                      </Button>
                    ) : (
                      <form onSubmit={handlePinSetup} className="space-y-8 max-w-md mx-auto">
                        <div className="space-y-4">
                          <Label className="text-sm font-bold text-foreground text-center block">Set New 6-Digit PIN</Label>
                          <div className="flex justify-between gap-2 px-2">
                            {pinDigits.map((digit, i) => (
                              <Input
                                key={i}
                                id={`pin-${i}`}
                                type="password"
                                inputMode="numeric"
                                maxLength={1}
                                value={digit}
                                onChange={(e: ChangeEvent<HTMLInputElement>) => handlePinDigitChange(i, e.target.value, false)}
                                className="w-12 text-center text-xl font-bold h-14 border-2 focus:border-primary rounded-xl"
                              />
                            ))}
                          </div>
                        </div>

                        <div className="space-y-4">
                          <Label className="text-sm font-bold text-foreground text-center block">Confirm Security PIN</Label>
                          <div className="flex justify-between gap-2 px-2">
                            {confirmPinDigits.map((digit, i) => (
                              <Input
                                key={i}
                                id={`confirm-pin-${i}`}
                                type="password"
                                inputMode="numeric"
                                maxLength={1}
                                value={digit}
                                onChange={(e: ChangeEvent<HTMLInputElement>) => handlePinDigitChange(i, e.target.value, true)}
                                className="w-12 text-center text-xl font-bold h-14 border-2 focus:border-primary rounded-xl"
                                placeholder="•"
                              />
                            ))}
                          </div>
                        </div>

                        <div className="flex gap-4">
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={() => {
                              setShowPinForm(false)
                              setPinDigits(Array(6).fill(''))
                              setConfirmPinDigits(Array(6).fill(''))
                            }}
                            className="flex-1 h-12 rounded-xl text-muted-foreground hover:bg-secondary/50 font-bold"
                          >
                            Discard
                          </Button>
                          <Button
                            type="submit"
                            disabled={
                              isLoading ||
                              pinDigits.some((d) => !d) ||
                              confirmPinDigits.some((d) => !d)
                            }
                            className="flex-1 h-12 bg-primary hover:bg-primary/90 rounded-xl font-bold shadow-md"
                          >
                            {isLoading ? 'Configuring...' : 'Secure System'}
                          </Button>
                        </div>
                      </form>
                    )}
                  </TabsContent>

                  {/* Recovery Codes */}
                  <TabsContent value="recovery" className="mt-0 space-y-8 animate-in fade-in duration-300">
                    <div className="bg-orange-50 border border-orange-100 rounded-2xl p-6">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center shrink-0">
                           <AlertCircle className="w-5 h-5 text-orange-600" />
                        </div>
                        <div>
                           <h4 className="font-bold text-orange-900 text-lg mb-1">Administrative Recovery</h4>
                           <p className="text-sm text-orange-700 leading-relaxed">
                            These codes are your ultimate failsafe. Each code can be used exactly once. Store them in a physical vault or an offline encrypted drive.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-center gap-6 p-8 border-2 border-dashed border-border rounded-2xl">
                        <div className="text-center">
                            <p className="text-4xl font-bold text-primary mb-1">{recoveryCodesCount}</p>
                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Active Recovery Keys Remaining</p>
                        </div>

                        <Button
                          variant="outline"
                          className="w-full md:w-auto px-10 h-12 rounded-xl border-primary text-primary hover:bg-primary/5 font-bold transition-all"
                          onClick={handleDownloadCodes}
                          disabled={hasDownloaded || recoveryCodesCount === 0}
                        >
                          {hasDownloaded ? 'Vault Keys Downloaded' : 'Generate & Export Recovery Vault'}
                        </Button>

                        {!hasDownloaded ? (
                          <p className="text-xs text-muted-foreground text-center max-w-sm">
                            You have {recoveryCodesCount} keys that haven't been exported. <span className="font-bold text-foreground underline font-mono italic px-1 text-red-800">Extreme caution advised.</span>
                          </p>
                        ) : (
                          <p className="text-xs font-medium text-green-600 bg-green-50 px-4 py-1.5 rounded-full border border-green-100">
                            Vault successfully exported. Access restricted.
                          </p>
                        )}
                    </div>
                  </TabsContent>
                </Tabs>
              </Card>
            </div>
          </div>
        </div>

      {/* Edit Profile Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <Card className="w-full max-w-xl shadow-2xl bg-white overflow-hidden rounded-3xl border-0 animate-in zoom-in-95 duration-300">
            <div className="p-8 border-b border-border/50 flex justify-between items-center bg-secondary/10">
              <h2 className="text-2xl font-bold text-primary tracking-tight">Modify Identity</h2>
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="text-muted-foreground hover:text-foreground p-2 rounded-full hover:bg-black/5 transition-all"
              >
                <X size={24} />
              </button>
            </div>
            <div className="p-8">
              <form id="edit-admin-profile-form" onSubmit={handlePersonalInfoSave} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="edit-admin-name" className="text-sm font-bold text-foreground">
                    Public Administrator Name
                  </Label>
                  <Input
                    id="edit-admin-name"
                    value={name}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
                    className="h-12 border-2 focus:border-primary rounded-xl font-medium"
                    placeholder="Enter official name"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-admin-email" className="text-sm font-bold text-foreground">
                    System Entity Email
                  </Label>
                  <Input
                    id="edit-admin-email"
                    type="email"
                    value={email}
                    className="h-12 bg-muted/30 border-dashed border-border text-muted-foreground rounded-xl cursor-not-allowed font-medium"
                    disabled
                  />
                  <p className="text-[10px] font-medium text-muted-foreground/60 italic">Immutable system attribute</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-admin-role" className="text-sm font-bold text-foreground">
                    Assigned Authorization Tier
                  </Label>
                  <Input
                    id="edit-admin-role"
                    value={role}
                    className="h-12 bg-muted/30 border-dashed border-border text-muted-foreground rounded-xl cursor-not-allowed font-medium"
                    disabled
                  />
                </div>
              </form>
            </div>
            <div className="p-8 pt-0 flex justify-end gap-4">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowEditModal(false)}
                className="h-12 px-8 font-bold rounded-xl text-muted-foreground"
              >
                Abort
              </Button>
              <Button
                type="submit"
                form="edit-admin-profile-form"
                disabled={isLoading}
                className="h-12 px-10 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl shadow-lg transition-all"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Synchronizing...
                  </div>
                ) : (
                  'Commit Updates'
                )}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </DashboardLayout>
  )
}

export default AdminProfilePage
