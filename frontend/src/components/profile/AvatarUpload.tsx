import { useState, useRef } from "react"
import { Button } from "../../components/ui/Button"
import { Upload, X } from "lucide-react"

interface AvatarUploadProps {
  currentAvatar?: string
  onAvatarChange: (file: File) => void
}

export default function AvatarUpload({
  currentAvatar,
  onAvatarChange,
}: AvatarUploadProps) {
  const [preview, setPreview] = useState<string | null>(
    currentAvatar ?? null
  )
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !file.type.startsWith("image/")) return

    const reader = new FileReader()
    reader.onloadend = () => {
      setPreview(reader.result as string)
      onAvatarChange(file)
    }
    reader.readAsDataURL(file)
  }

  const handleRemove = () => {
    setPreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Avatar Display */}
      <div className="relative w-32 h-32">
        {preview ? (
          <div className="relative w-full h-full rounded-full overflow-hidden border-4 border-primary shadow-lg">
            <img
              src={preview}
              alt="Avatar preview"
              className="absolute inset-0 w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="w-full h-full rounded-full border-4 border-border flex items-center justify-center bg-secondary/30">
            <span className="text-4xl">🌿</span>
          </div>
        )}

        {/* Remove Button */}
        {preview && (
          <button
            type="button"
            onClick={handleRemove}
            className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 transition-colors"
            title="Remove avatar"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        aria-label="Upload avatar"
      />

      {/* Upload Button */}
      <Button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        variant="outline"
        className="border-primary text-primary hover:bg-secondary/50 gap-2"
      >
        <Upload size={16} />
        {preview ? "Change Avatar" : "Upload Avatar"}
      </Button>

      <p className="text-xs text-muted-foreground text-center">
        Supported formats: JPG, PNG, GIF (Max 5MB)
      </p>
    </div>
  )
}
