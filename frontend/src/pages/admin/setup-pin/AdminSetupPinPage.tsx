import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../../../components/ui/Button'
import { Input } from '../../../components/ui/Input'
import { Label } from '../../../components/ui/Label'
import { Leaf, Copy, Download, Check } from 'lucide-react'

export default function AdminSetupPinPage() {
  const navigate = useNavigate()

  const [step, setStep] = useState<'pin' | 'recovery'>('pin')
  const [pinDigits, setPinDigits] = useState<string[]>(['', '', '', '', '', ''])
  const [confirmPinDigits, setConfirmPinDigits] = useState<string[]>(['', '', '', '', '', ''])
  const [isLoading, setIsLoading] = useState(false)
  const [copiedCode, setCopiedCode] = useState<number | null>(null)

  const recoveryCodes: string[] = [
    'HG-2024-A1B2C3D4',
    'HG-2024-E5F6G7H8',
    'HG-2024-I9J0K1L2',
    'HG-2024-M3N4O5P6',
    'HG-2024-Q7R8S9T0',
    'HG-2024-U1V2W3X4',
    'HG-2024-Y5Z6A7B8',
    'HG-2024-C9D0E1F2',
    'HG-2024-G3H4I5J6',
    'HG-2024-K7L8M9N0',
  ]

  const handlePinDigitChange = (
    index: number,
    value: string,
    isConfirm = false
  ) => {
    const digit = value.replace(/[^0-9]/g, '').slice(0, 1)

    if (isConfirm) {
      const updated = [...confirmPinDigits]
      updated[index] = digit
      setConfirmPinDigits(updated)
    } else {
      const updated = [...pinDigits]
      updated[index] = digit
      setPinDigits(updated)
    }

    if (digit && index < 5) {
      const next = document.getElementById(
        `${isConfirm ? 'confirm-' : ''}pin-${index + 1}`
      ) as HTMLInputElement | null
      next?.focus()
    }
  }


  const handleSetPin = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    const pin = pinDigits.join('')
    const confirmPin = confirmPinDigits.join('')

    if (pin !== confirmPin) {
      alert('PINs do not match')
      return
    }

    setIsLoading(true)

    setTimeout(() => {
      setIsLoading(false)
      setStep('recovery')
    }, 1000)
  }

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text)
    setCopiedCode(index)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  const handleDownloadCodes = () => {
    const blob = new Blob([recoveryCodes.join('\n')], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)

    const a = document.createElement('a')
    a.href = url
    a.download = 'healing-garden-recovery-codes.txt'
    a.click()

    URL.revokeObjectURL(url)
  }

  const handleFinish = () => {
    navigate('/admin/dashboard')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/30 flex items-center justify-center px-4">
      <div className="absolute top-10 right-10 opacity-20 animate-pulse">
        <Leaf size={60} className="text-primary" />
      </div>

      <div className="absolute bottom-10 left-10 opacity-20 animate-pulse">
        <Leaf size={80} className="text-primary" />
      </div>

      <div className="w-full max-w-md z-10">
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
          {step === 'pin' && (
            <>
              <h1 className="text-3xl font-bold text-primary text-center mb-2">
                Set Admin PIN
              </h1>

              <form onSubmit={handleSetPin} className="space-y-6">
                <div>
                  <Label>6-Digit PIN</Label>
                  <div className="flex gap-2 justify-between">
                    {pinDigits.map((d, i) => (
                      <Input
                        key={i}
                        id={`pin-${i}`}
                        value={d}
                        maxLength={1}
                        inputMode="numeric"
                        type="password"
                        onChange={(e) =>
                          handlePinDigitChange(i, e.target.value)
                        }
                        className="w-12 h-12 text-center text-xl"
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <Label>Confirm PIN</Label>
                  <div className="flex gap-2 justify-between">
                    {confirmPinDigits.map((d, i) => (
                      <Input
                        key={i}
                        id={`confirm-pin-${i}`}
                        value={d}
                        maxLength={1}
                        inputMode="numeric"
                        type="password"
                        onChange={(e) =>
                          handlePinDigitChange(i, e.target.value, true)
                        }
                        className="w-12 h-12 text-center text-xl"
                      />
                    ))}
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={
                    isLoading ||
                    pinDigits.some((d) => !d) ||
                    confirmPinDigits.some((d) => !d)
                  }
                  className="w-full"
                >
                  {isLoading ? 'Setting PIN...' : 'Continue'}
                </Button>
              </form>
            </>
          )}

          {step === 'recovery' && (
            <>
              <h1 className="text-3xl font-bold text-center mb-4">
                Save Recovery Codes
              </h1>

              <div className="space-y-3">
                {recoveryCodes.map((code, i) => (
                  <div
                    key={i}
                    className="flex justify-between items-center bg-secondary/30 p-3 rounded-lg"
                  >
                    <code>{code}</code>
                    <button onClick={() => copyToClipboard(code, i)}>
                      {copiedCode === i ? (
                        <Check size={18} />
                      ) : (
                        <Copy size={18} />
                      )}
                    </button>
                  </div>
                ))}
              </div>

              <div className="mt-6 space-y-3">
                <Button variant="outline" onClick={handleDownloadCodes}>
                  <Download size={18} /> Download Codes
                </Button>

                <Button onClick={handleFinish}>
                  Complete Setup
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
