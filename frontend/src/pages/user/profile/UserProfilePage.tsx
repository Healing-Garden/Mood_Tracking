import React, { useState, useEffect } from 'react'
import type { FormEvent, ChangeEvent } from 'react'
import { Button } from '../../../components/ui/Button'
import { Input } from '../../../components/ui/Input'
// import { Label } from '../../../components/ui/Label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/Tabs'
import AvatarUpload from '../../../components/profile/AvatarUpload'
import { Lock, X, ShieldCheck, Key, User, Check, Cake, Ruler, Scale } from 'lucide-react'
import DashboardLayout from '../../../components/layout/DashboardLayout'
import { Card } from '../../../components/ui/Card'
import { useToast } from '../../../hooks/use-toast'
import { userApi } from '../../../api/userApi'

const SecurityPinModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  mode: 'setup' | 'verify_to_disable' | 'verify_to_enable' | 'verify_to_change';
  onSuccess: (newPin?: string) => void;
}> = ({ isOpen, onClose, mode, onSuccess }) => {
  const [step, setStep] = useState(mode === 'setup' ? 'new' : 'verify');
  const [pinDigits, setPinDigits] = useState<string[]>(Array(6).fill(''));
  const [confirmPinDigits, setConfirmPinDigits] = useState<string[]>(Array(6).fill(''));
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      setStep(mode === 'setup' ? 'new' : 'verify');
      setPinDigits(Array(6).fill(''));
      setConfirmPinDigits(Array(6).fill(''));
    }
  }, [isOpen, mode]);

  const handlePinDigitChange = (index: number, value: string, isConfirm: boolean = false) => {
    const digit = value.replace(/[^0-9]/g, '').slice(0, 1);
    const target = isConfirm ? [...confirmPinDigits] : [...pinDigits];
    target[index] = digit;

    if (isConfirm) setConfirmPinDigits(target);
    else setPinDigits(target);

    if (digit && index < 5) {
      const prefix = isConfirm ? 'conf-' : 'pin-';
      document.getElementById(`${prefix}${index + 1}`)?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const pin = pinDigits.join('');
    const confirmPin = confirmPinDigits.join('');

    if (step === 'verify') {
      setIsLoading(true);
      try {
        await userApi.verifyAppLockPin(pin);
        if (mode === 'verify_to_change') {
          setStep('new');
          setPinDigits(Array(6).fill(''));
        } else {
          onSuccess();
          onClose();
        }
      } catch (error) {
        toast({ title: 'Error', description: 'Incorrect PIN', variant: 'destructive' });
      } finally {
        setIsLoading(false);
      }
    } else if (step === 'new') {
      setStep('confirm');
    } else {
      if (pin !== confirmPin) {
        toast({ title: 'Error', description: 'PIN confirmation does not match', variant: 'destructive' });
        return;
      }
      setIsLoading(true);
      try {
        await userApi.setAppLockPin(pin);
        onSuccess(pin);
        onClose();
      } catch (error) {
        toast({ title: 'Error', description: 'Unable to set PIN', variant: 'destructive' });
      } finally {
        setIsLoading(false);
      }
    }
  };

  if (!isOpen) return null;

  const titles = {
    setup: 'Set App Lock PIN',
    verify_to_disable: 'Disable App Lock',
    verify_to_enable: 'Enable App Lock',
    verify_to_change: 'Change App Lock PIN'
  };

  const instructions = {
    verify: 'Enter your current 6-digit PIN to continue',
    new: 'Enter a new 6-digit secure PIN',
    confirm: 'Please confirm your new 6-digit PIN'
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-secondary/15 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <Card className="w-full max-w-md bg-white dark:bg-slate-900 shadow-2xl overflow-hidden border border-primary/10 rounded-2xl animate-in zoom-in-95 duration-200">
        <div className="px-8 pt-8 pb-4 flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{titles[mode]}</h2>
            <p className="text-primary text-sm font-normal mt-1">{instructions[step as keyof typeof instructions]}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-primary transition-colors p-1">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-8 py-6 space-y-8">
          <div className="flex justify-center gap-2 sm:gap-3">
            {(step === 'confirm' ? confirmPinDigits : pinDigits).map((digit, i) => (
              <Input
                key={i}
                id={`${step === 'confirm' ? 'conf-' : 'pin-'}${i}`}
                type="password"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e: ChangeEvent<HTMLInputElement>) => handlePinDigitChange(i, e.target.value, step === 'confirm')}
                className="w-10 h-12 sm:w-12 sm:h-14 text-center text-2xl font-bold border-primary/20 bg-primary/5 focus:ring-2 focus:ring-primary focus:border-transparent rounded-xl outline-none transition-all shadow-sm"
                autoFocus={i === 0}
              />
            ))}
          </div>

          <div className="pt-2 flex items-center justify-end gap-4">
            <Button type="button" variant="ghost" onClick={onClose} className="px-6 py-2.5 text-slate-500 hover:text-primary hover:bg-primary/5 font-semibold transition-colors rounded-lg" disabled={isLoading}>
              Cancel
            </Button>
            <Button
              type="submit"
              className="px-8 py-2.5 bg-primary text-white rounded-lg font-semibold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all flex items-center gap-2"
              disabled={isLoading || (step === 'confirm' ? confirmPinDigits : pinDigits).some(d => !d)}
            >
              {isLoading ? 'Processing...' : (
                <>
                  <Check size={20} />
                  {(step === 'confirm' || (step === 'verify' && mode === 'verify_to_disable')) ? 'Confirm' : 'Next'}
                </>
              )}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

const PasswordChangeModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  hasPassword: boolean;
  onSuccess: () => void;
}> = ({ isOpen, onClose, hasPassword, onSuccess }) => {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handlePasswordChange = async (e: FormEvent) => {
    e.preventDefault()
    setPasswordError('')

    if (!newPassword || newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters')
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Confirmation password does not match')
      return
    }

    setIsLoading(true)
    try {
      await userApi.changePassword({ currentPassword, newPassword })
      onSuccess()
      onClose()
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Error updating password'
      setPasswordError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-secondary/15 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <Card className="w-full max-w-lg bg-white dark:bg-slate-900 shadow-2xl overflow-hidden border border-primary/10 rounded-2xl animate-in zoom-in-95 duration-200">
        <div className="px-8 pt-8 pb-4 flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Update Password</h2>
            <p className="text-primary text-sm font-normal mt-1">Enhance your account security with a new password</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-primary transition-colors p-1">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handlePasswordChange} className="px-8 py-6 space-y-5">
          {passwordError && <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 animate-in fade-in">{passwordError}</div>}

          {hasPassword && (
            <div className="flex flex-col gap-2">
              <label className="text-primary text-sm font-semibold flex items-center gap-2">
                <Lock size={16} /> Current Password
              </label>
              <Input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="w-full px-4 py-3 rounded-lg border border-primary/20 bg-primary/5 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all placeholder:text-slate-400" placeholder="••••••••" required />
            </div>
          )}

          <div className="flex flex-col gap-2">
            <label className="text-primary text-sm font-semibold flex items-center gap-2">
              <Key size={16} /> New Password
            </label>
            <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full px-4 py-3 rounded-lg border border-primary/20 bg-primary/5 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all placeholder:text-slate-400" placeholder="••••••••" required />
            <p className="text-[10px] text-muted-foreground uppercase font-bold ml-1">8+ chars, uppercase & special char</p>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-primary text-sm font-semibold flex items-center gap-2">
              <ShieldCheck size={16} /> Confirm New Password
            </label>
            <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full px-4 py-3 rounded-lg border border-primary/20 bg-primary/5 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all placeholder:text-slate-400" placeholder="••••••••" required />
          </div>

          <div className="pt-4 flex items-center justify-end gap-4 pb-4">
            <Button type="button" variant="ghost" onClick={onClose} className="px-6 py-2.5 text-slate-500 hover:text-primary hover:bg-primary/5 font-semibold transition-colors rounded-lg" disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="px-8 py-2.5 bg-primary text-white rounded-lg font-semibold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all flex items-center gap-2">
              {isLoading ? 'Saving...' : (
                <>
                  <Check size={20} />
                  Update
                </>
              )}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}

const EditProfileModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  name: string;
  setName: (v: string) => void;
  age: string;
  setAge: (v: string) => void;
  height: string;
  setHeight: (v: string) => void;
  weight: string;
  setWeight: (v: string) => void;
  onSave: (e: FormEvent) => void;
  isLoading: boolean;
}> = ({ isOpen, onClose, name, setName, age, setAge, height, setHeight, weight, setWeight, onSave, isLoading }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-primary/10 backdrop-blur-md animate-in fade-in duration-300">
      <Card className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-xl shadow-2xl overflow-hidden border border-primary/10 animate-in zoom-in-95 duration-200">
        <div className="px-8 pt-8 pb-4 flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Edit Profile</h2>
            <p className="text-primary text-sm font-normal mt-1">Update your personal wellness information</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-primary transition-colors p-1">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={onSave} className="px-8 py-4 space-y-5">
          <div className="flex flex-col gap-2">
            <label className="text-primary text-sm font-semibold flex items-center gap-2">
              <User size={16} /> Full Name
            </label>
            <Input
              className="w-full px-4 py-3 rounded-lg border border-primary/20 bg-primary/5 focus:ring-2 focus:ring-primary focus:border-transparent text-slate-900 dark:text-slate-100 outline-none transition-all placeholder:text-slate-400"
              placeholder="Enter your name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-primary text-sm font-semibold flex items-center gap-2">
                <Cake size={16} /> Age
              </label>
              <Input
                className="w-full px-4 py-3 rounded-lg border border-primary/20 bg-primary/5 focus:ring-2 focus:ring-primary focus:border-transparent text-slate-900 dark:text-slate-100 outline-none transition-all placeholder:text-slate-400"
                placeholder="Years"
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-primary text-sm font-semibold flex items-center gap-2">
                <Ruler size={16} /> Height (cm)
              </label>
              <Input
                className="w-full px-4 py-3 rounded-lg border border-primary/20 bg-primary/5 focus:ring-2 focus:ring-primary focus:border-transparent text-slate-900 dark:text-slate-100 outline-none transition-all placeholder:text-slate-400"
                placeholder="cm"
                type="number"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-primary text-sm font-semibold flex items-center gap-2">
              <Scale size={16} /> Weight (kg)
            </label>
            <Input
              className="w-full px-4 py-3 rounded-lg border border-primary/20 bg-primary/5 focus:ring-2 focus:ring-primary focus:border-transparent text-slate-900 dark:text-slate-100 outline-none transition-all placeholder:text-slate-400"
              placeholder="kg"
              type="number"
              step="0.1"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
            />
          </div>

          <div className="py-6 flex items-center justify-end gap-4">
            <button type="button" onClick={onClose} className="px-6 py-2.5 rounded-lg text-slate-500 hover:text-primary hover:bg-primary/5 font-semibold transition-colors">
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-8 py-2.5 bg-primary text-white rounded-lg font-semibold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all flex items-center gap-2"
            >
              {isLoading ? 'Saving...' : (
                <>
                  <Check size={20} />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
};

const UserProfilePage: React.FC = () => {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState<'personal' | 'password' | 'security'>('personal')
  const [isLoadingProfile, setIsLoadingProfile] = useState<boolean>(true)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState<boolean>(false)
  const [successMessage, setSuccessMessage] = useState<string>('')
  const [showEditModal, setShowEditModal] = useState<boolean>(false)
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState<boolean>(false)

  // Personal Info
  const [name, setName] = useState<string>('')
  const [age, setAge] = useState<string>('')
  const [height, setHeight] = useState<string>('')
  const [weight, setWeight] = useState<string>('')
  const [email, setEmail] = useState<string>('')
  const [avatar, setAvatar] = useState<string>('')

  // Password
  const [hasPassword, setHasPassword] = useState<boolean>(true)

  // PIN
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [pinModalMode, setPinModalMode] = useState<'setup' | 'verify_to_disable' | 'verify_to_enable' | 'verify_to_change'>('setup');
  const [isAppLockEnabled, setIsAppLockEnabled] = useState<boolean>(false)
  const [hasPinSet, setHasPinSet] = useState<boolean>(false)

  const showSuccess = (message: string) => {
    setSuccessMessage(message)
    setTimeout(() => setSuccessMessage(''), 5000);
  }

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
        setIsAppLockEnabled(!!profile.appLockEnabled)
        setHasPinSet(!!profile.hasAppLockPin)
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
    setIsLoading(true)
    try {
      const response = await userApi.updateProfile({
        fullName: name,
        age: age ? parseInt(age) : undefined,
        heightCm: height ? parseInt(height) : undefined,
        weight: weight ? parseFloat(weight) : undefined,
      })
      setAvatar(response.user.avatarUrl || avatar)
      showSuccess('Personal information has been updated.')
      setShowEditModal(false)
    } catch (error) {
      console.error('Profile update error:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Unable to update profile info',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handlePinSuccess = async (_newPin?: string) => {
    if (pinModalMode === 'verify_to_disable' || pinModalMode === 'verify_to_enable') {
      const shouldEnable = pinModalMode === 'verify_to_enable';
      try {
        await userApi.toggleAppLock(shouldEnable);
        setIsAppLockEnabled(shouldEnable);
        showSuccess(`App Lock has been ${shouldEnable ? 'enabled' : 'disabled'} successfully.`);
      } catch (error) {
        toast({ 
          title: 'Error', 
          description: `Unable to ${shouldEnable ? 'enable' : 'disable'} App Lock`, 
          variant: 'destructive' 
        });
      }
    } else {
      setHasPinSet(true);
      setIsAppLockEnabled(true);
      showSuccess('PIN has been established successfully.');
    }
  }

  if (isLoadingProfile) {
    return (
      <DashboardLayout title="My Profile">
        <div className="flex-1 flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title="My Profile">
      <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-10 py-8 max-w-[1600px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1 space-y-6">
            <Card className="bg-white rounded-2xl shadow-xl border-none p-8 flex flex-col items-center">
              <AvatarUpload
                currentAvatar={avatar}
                onAvatarChange={handleAvatarUpload}
                onRemove={handleAvatarRemove}
                isLoading={isUploadingAvatar}
              />
              <div className="mt-8 pt-6 border-t border-border/50 w-full text-center">
                <p className="text-xs uppercase tracking-widest font-bold text-muted-foreground mb-2">Member Status</p>
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-bold">
                  <ShieldCheck size={14} /> Active Member
                </div>
              </div>
            </Card>
          </div>

          <div className="lg:col-span-3">
            {successMessage && (
              <div className="rounded-xl border border-green-200 bg-green-50 px-6 py-4 text-sm text-green-700 shadow-sm animate-in slide-in-from-top-4 duration-300">
                {successMessage}
              </div>
            )}

            <Card className="bg-white rounded-2xl shadow-lg border-none p-6">
              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
                <TabsList className="grid w-full grid-cols-3 bg-secondary/50 rounded-lg">
                  <TabsTrigger
                    value="personal"
                    className="data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm hover:bg-white/50"
                  >
                    Personal Info
                  </TabsTrigger>
                  <TabsTrigger
                    value="password"
                    className="data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm hover:bg-white/50"
                  >
                    Password
                  </TabsTrigger>
                  <TabsTrigger
                    value="security"
                    className="data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm hover:bg-white/50"
                  >
                    Security
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="personal" className="mt-0 animate-in fade-in duration-500 space-y-8">
                  <div className="p-8 bg-secondary/10 rounded-2xl border-2 border-dashed border-primary/20 flex flex-col md:flex-row items-center gap-6 justify-between">
                    <div className="flex gap-4">
                      <div className="p-3 bg-primary/20 text-primary rounded-2xl h-fit">
                        <User size={24} />
                      </div>
                      <div>
                        <h4 className="text-xl font-bold text-primary mb-2">Personal Identity</h4>
                        <p className="text-sm text-muted-foreground leading-relaxed max-w-md">
                          Your profile information helps us personalize your journey and provide better insights.
                        </p>
                      </div>
                    </div>
                    <Button
                      onClick={() => setShowEditModal(true)}
                      className="px-8 h-12 bg-primary hover:bg-primary/90 rounded-xl shadow-lg font-bold transition-all active:scale-95"
                    >
                      Edit Profile
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { label: 'Full Name', value: name },
                      { label: 'Email', value: email },
                      { label: 'Age', value: age ? `${age} years old` : null },
                      { label: 'Height', value: height ? `${height} cm` : null },
                      { label: 'Weight', value: weight ? `${weight} kg` : null }
                    ].map((item, i) => (
                      <div key={i} className="p-6 bg-white rounded-2xl border border-border/50 shadow-sm hover:border-primary/20 transition-all group">
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1 group-hover:text-primary/60 transition-colors">{item.label}</p>
                        <p className="text-base font-bold text-foreground">{item.value || 'Not provided'}</p>
                      </div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="password" className="mt-0 animate-in fade-in duration-500">
                  <div className="p-8 bg-secondary/10 rounded-2xl border-2 border-dashed border-primary/20 flex flex-col md:flex-row items-center gap-6 justify-between">
                    <div className="space-y-2">
                      <h4 className="text-xl font-bold text-primary">Security Recommendation</h4>
                      <p className="text-sm text-muted-foreground leading-relaxed max-w-md">
                        Update your password every 3 months to keep your account safe and secure.
                      </p>
                    </div>
                    <Button
                      onClick={() => setIsPasswordModalOpen(true)}
                      className="px-8 h-12 bg-primary hover:bg-primary/90 rounded-xl shadow-lg font-bold transition-all active:scale-95"
                    >
                      Update Password
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="security" className="mt-0 animate-in fade-in duration-500 space-y-8">
                  <div className="p-8 bg-secondary/10 rounded-2xl border-2 border-dashed border-primary/20 flex flex-col md:flex-row items-center gap-6 justify-between">
                    <div className="flex gap-4">
                      <div className="p-3 bg-primary/20 text-primary rounded-2xl h-fit">
                        <Lock size={24} />
                      </div>
                      <div>
                        <h4 className="text-xl font-bold text-primary mb-2">App Lock PIN</h4>
                        <p className="text-sm text-muted-foreground leading-relaxed max-w-md">
                          Requires a 6-digit PIN to access sensitive areas of the app, ensuring your journals remain private.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest ${isAppLockEnabled ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                        {isAppLockEnabled ? 'Protected' : 'Inactive'}
                      </span>
                      {hasPinSet && (
<<<<<<< HEAD
                        <Button
                          variant="outline"
                          className="h-10 rounded-lg font-bold border-2"
                          onClick={() => { setPinModalMode('verify_to_disable'); setIsPinModalOpen(true); }}
=======
                        <Button 
                          variant="outline" 
                          className="h-10 rounded-lg font-bold border-2" 
                          onClick={() => { 
                            setPinModalMode(isAppLockEnabled ? 'verify_to_disable' : 'verify_to_enable'); 
                            setIsPinModalOpen(true); 
                          }}
>>>>>>> 7d44ebb8cf90133543137126e5fb7599ba28d3bd
                        >
                          {isAppLockEnabled ? 'Disable' : 'Enable'}
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button
                      onClick={() => { setPinModalMode(hasPinSet ? 'verify_to_change' : 'setup'); setIsPinModalOpen(true); }}
                      className="h-14 bg-primary hover:bg-primary/90 rounded-2xl shadow-xl font-bold text-lg gap-3"
                    >
                      <Key size={20} />
                      {hasPinSet ? 'Change Security PIN' : 'Set Security PIN'}
                    </Button>
                    {!hasPinSet && (
                      <div className="flex items-center p-4 bg-primary/5 rounded-2xl">
                        <p className="text-xs text-primary/70 italic leading-relaxed">
                          Your peace of mind is our priority. A PIN adds an extra layer of privacy for your personal thoughts.
                        </p>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </Card>
          </div>
        </div>
      </main>

      <EditProfileModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        name={name}
        setName={setName}
        age={age}
        setAge={setAge}
        height={height}
        setHeight={setHeight}
        weight={weight}
        setWeight={setWeight}
        onSave={handlePersonalInfoSave}
        isLoading={isLoading}
      />

      <SecurityPinModal
        isOpen={isPinModalOpen}
        onClose={() => setIsPinModalOpen(false)}
        mode={pinModalMode}
        onSuccess={handlePinSuccess}
      />

      <PasswordChangeModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        hasPassword={hasPassword}
        onSuccess={() => {
          setHasPassword(true);
          showSuccess('Password has been updated successfully.');
        }}
      />
    </DashboardLayout>
  )
}

export default UserProfilePage