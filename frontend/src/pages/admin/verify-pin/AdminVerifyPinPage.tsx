import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../../../components/ui/Button'
import { Input } from '../../../components/ui/Input'
import { Label } from '../../../components/ui/Label'
import { Leaf } from 'lucide-react'

export default function AdminVerifyPinPage() {
  const navigate = useNavigate()

  const [pinDigits, setPinDigits] = useState<string[]>(['', '', '', '', '', ''])
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<string>('')

  const handlePinDigitChange = (index: number, value: string) => {
    const digit = value.replace(/[^0-9]/g, '').slice(0, 1)
    const updated = [...pinDigits]
    updated[index] = digit
    setPinDigits(updated)

    if (digit && index < 5) {
      const next = document.getElementById(`pin-${index + 1}`) as HTMLInputElement | null
      next?.focus()
    }

    if (updated.every((d) => d)) {
      handleVerify(updated.join(''))
    }
  }

  const handleVerify = (pin: string) => {
    setError('')
    setIsLoading(true)

    setTimeout(() => {
      if (pin === '123456') {
        navigate('/admin/dashboard')
      } else {
        setError('Invalid PIN. Please try again.')
        setPinDigits(['', '', '', '', '', ''])
        setIsLoading(false)
      }
    }, 1000)
  }

  const handleForgotPin = () => {
    navigate('/forgot-password?type=admin')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/30 flex items-center justify-center px-4">
      {/* Decorative leaves */}
      <div className="absolute top-10 right-10 opacity-20 animate-pulse">
        <Leaf size={60} className="text-primary" />
      </div>

      <div
        className="absolute bottom-10 left-10 opacity-20 animate-pulse"
        style={{ animationDelay: '1s' }}
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

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-border">
          <h1 className="text-3xl font-bold text-primary mb-2 text-center">
            Admin PIN Verification
          </h1>
          <p className="text-center text-muted-foreground mb-8">
            Enter your 6-digit PIN to continue
          </p>

          <div className="space-y-6">
            <div className="space-y-3">
              <Label className="text-primary font-semibold">Your PIN</Label>
              <div className="flex gap-2 justify-between">
                {pinDigits.map((digit, i) => (
                  <Input
                    key={i}
                    id={`pin-${i}`}
                    type="password"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    autoFocus={i === 0}
                    onChange={(e) => handlePinDigitChange(i, e.target.value)}
                    className="w-12 h-12 text-center text-xl font-semibold border-2 border-border focus:border-primary rounded-lg transition-colors"
                    placeholder="•"
                  />
                ))}
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600 font-semibold">{error}</p>
              </div>
            )}

            <Button
              disabled={isLoading || pinDigits.some((d) => !d)}
              className="w-full bg-primary hover:bg-primary/90 text-white h-11 font-semibold"
            >
              {isLoading ? 'Verifying...' : 'Verify PIN'}
            </Button>

            <div className="text-center">
              <button
                onClick={handleForgotPin}
                className="text-sm text-primary hover:text-primary/80 font-semibold"
              >
                Forgot PIN? Use recovery code
              </button>
            </div>
          </div>

          <div className="mt-6 p-4 bg-secondary/30 rounded-lg border border-border text-center text-sm text-muted-foreground">
            <p>Demo PIN: 123456</p>
          </div>
        </div>
      </div>
    </div>
  )
}
