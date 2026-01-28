import React, { useState } from 'react'
import type { FormEvent } from 'react'
import { Button } from '../../../components/ui/Button'
import { Input } from '../../../components/ui/Input'
import { Label } from '../../../components/ui/Label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/Tabs'
import AvatarUpload from '../../../components/profile/AvatarUpload'
import { Eye, EyeOff, Lock, Copy, Check, AlertCircle } from 'lucide-react'

const AdminProfilePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('personal')
  const [isLoading, setIsLoading] = useState(false)
  const [copiedCode, setCopiedCode] = useState<number | null>(null)

  // Personal Info
  const [name, setName] = useState('Admin User')
  const [email, setEmail] = useState('admin@healingarden.com')
  const [role, setRole] = useState('System Administrator')

  // Password
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPasswords, setShowPasswords] = useState(false)

  // PIN
  const [showPinForm, setShowPinForm] = useState(false)
  const [pinDigits, setPinDigits] = useState<string[]>(Array(6).fill(''))
  const [confirmPinDigits, setConfirmPinDigits] = useState<string[]>(Array(6).fill(''))

  // Recovery Codes (mock data)
  const [recoveryCodes] = useState<string[]>([
    'HG-2024-A1B2C3',
    'HG-2024-D4E5F6',
    'HG-2024-G7H8I9',
    'HG-2024-J0K1L2',
    'HG-2024-M3N4O5',
    'HG-2024-P6Q7R8',
    'HG-2024-S9T0U1',
    'HG-2024-V2W3X4',
    'HG-2024-Y5Z6A7',
    'HG-2024-B8C9D0',
  ])

  const handlePersonalInfoSave = async (e: FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    // TODO: API call to save profile
    console.log('Saving personal info:', { name, email, role })
    await new Promise((resolve) => setTimeout(resolve, 1200))
    setIsLoading(false)
  }

  const handlePasswordChange = async (e: FormEvent) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      alert('New passwords do not match')
      return
    }
    setIsLoading(true)
    // TODO: API call to change password
    console.log('Changing password')
    await new Promise((resolve) => setTimeout(resolve, 1200))
    setIsLoading(false)
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
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

    setIsLoading(true)
    // TODO: API call to set PIN
    console.log('Setting PIN:', pin)
    await new Promise((resolve) => setTimeout(resolve, 1200))
    setIsLoading(false)
    setShowPinForm(false)
    setPinDigits(Array(6).fill(''))
    setConfirmPinDigits(Array(6).fill(''))
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
    const content = recoveryCodes.join('\n')
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'recovery-codes.txt'
    link.click()
    URL.revokeObjectURL(url)
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
          <h1 className="text-2xl font-bold text-primary">Admin Profile</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Avatar & Role Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-border flex flex-col items-center">
              <AvatarUpload
                currentAvatar="/default-avatar.png" // optional
                onAvatarChange={(file) => console.log('New avatar file:', file)}
              />
              <div className="mt-6 pt-4 border-t border-border w-full text-center">
                <p className="text-sm font-semibold text-primary mb-1">Role</p>
                <p className="text-sm text-muted-foreground">{role}</p>
              </div>
            </div>
          </div>

          {/* Main Tabs Content */}
          <div className="lg:col-span-3">
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="bg-white rounded-2xl shadow-lg border border-border p-6"
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
                      onChange={(e) => setName(e.target.value)}
                      className="h-11"
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
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="admin-role" className="text-primary font-medium">
                      Role
                    </Label>
                    <Input
                      id="admin-role"
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      className="h-11"
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
                  <div className="space-y-2">
                    <Label htmlFor="current-password" className="text-primary font-medium">
                      Current Password
                    </Label>
                    <div className="relative">
                      <Input
                        id="current-password"
                        type={showPasswords ? 'text' : 'password'}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="h-11 pr-10"
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
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="h-11"
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
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="h-11"
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
                            onChange={(e) => handlePinDigitChange(i, e.target.value, false)}
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
                            onChange={(e) => handlePinDigitChange(i, e.target.value, true)}
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
                      Store these one-time-use recovery codes securely. Each can be used once to regain access if you lose your PIN or 2FA device.
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  {recoveryCodes.map((code, index) => (
                    <div
                      key={index}
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

                <Button
                  variant="outline"
                  className="w-full h-11 border-primary text-primary hover:bg-primary/10"
                  onClick={handleDownloadCodes}
                >
                  Download All Codes
                </Button>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
    </div>
  )
}

export default AdminProfilePage