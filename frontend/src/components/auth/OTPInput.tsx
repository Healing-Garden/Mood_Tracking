import { useRef } from "react"
import { Input } from "../../components/ui/Input"

interface OTPInputProps {
  length?: number
  value: string
  onChange: (value: string) => void
  onComplete?: (value: string) => void
}

export default function OTPInput({
  length = 6,
  value,
  onChange,
  onComplete,
}: OTPInputProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  const handleChange = (index: number, val: string) => {
    const digit = val.replace(/[^0-9]/g, "")
    if (digit.length > 1) return

    const newValue = value.split("")
    newValue[index] = digit
    const updatedValue = newValue.join("")

    onChange(updatedValue)

    if (digit && index < length - 1) {
      inputRefs.current[index + 1]?.focus()
    }

    if (updatedValue.length === length && onComplete) {
      onComplete(updatedValue)
    }
  }

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Backspace" && !value[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const pasted = e.clipboardData
      .getData("text")
      .replace(/[^0-9]/g, "")
      .slice(0, length)

    onChange(pasted)

    if (pasted.length === length && onComplete) {
      onComplete(pasted)
    }
  }

  return (
    <div className="flex justify-between gap-2">
      {Array.from({ length }).map((_, index) => (
        <Input
          key={index}
          ref={(el) => (inputRefs.current[index] = el)}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value[index] ?? ""}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          className="w-12 h-12 text-center text-xl font-semibold border-2 border-border focus:border-primary focus:outline-none rounded-lg transition-colors"
          placeholder="•"
        />
      ))}
    </div>
  )
}
