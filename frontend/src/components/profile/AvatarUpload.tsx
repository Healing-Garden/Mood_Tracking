import { useState, useRef, useEffect } from "react"
import { Button } from "../../components/ui/Button"
import { Upload, X, Loader2 } from "lucide-react"

interface AvatarUploadProps {
  currentAvatar?: string
  onAvatarChange: (file: File) => Promise<void>
  onAvatarRemove?: () => Promise<void>
}

const DEFAULT_AVATAR_URL =
  "https://i.pinimg.com/originals/bc/43/98/bc439871417621836a0eeea768d60944.jpg"

const resolveAvatarUrl = (url?: string | null) => {
  if (typeof url !== "string") return DEFAULT_AVATAR_URL
  const trimmed = url.trim()
  if (!trimmed) return DEFAULT_AVATAR_URL
  return trimmed
}

export default function AvatarUpload({
  currentAvatar,
  onAvatarChange,
  onAvatarRemove,
}: AvatarUploadProps) {
  const [preview, setPreview] = useState<string | null>(
    resolveAvatarUrl(currentAvatar)
  )
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showConfirm, setShowConfirm] = useState(false)
  const [removing, setRemoving] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!uploading) {
      setPreview(resolveAvatarUrl(currentAvatar))
    }
  }, [currentAvatar, uploading])

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !file.type.startsWith("image/")) {
      setError("Please select a valid image file")
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("File size must be less than 5MB")
      return
    }

    const reader = new FileReader()
    reader.onloadend = async () => {
      setPreview(reader.result as string)
      setError(null)
      setUploading(true)
      try {
        await onAvatarChange(file)
      } catch (err: any) {
        setError(err?.response?.data?.message || "Failed to upload avatar")
        setPreview(resolveAvatarUrl(currentAvatar))
      } finally {
        setUploading(false)
      }
    }
    reader.readAsDataURL(file)
  }

  const handleRemove = () => {
    setShowConfirm(true)
  }

  const confirmRemove = async () => {
    setRemoving(true)
    setError(null)
    try {
      if (onAvatarRemove) {
        await onAvatarRemove()
      }
      setPreview(DEFAULT_AVATAR_URL)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
      setShowConfirm(false)
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to remove avatar")
    } finally {
      setRemoving(false)
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
            {uploading && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-full">
                <Loader2 className="w-8 h-8 text-white animate-spin" />
              </div>
            )}
          </div>
        ) : (
          <div className="w-full h-full rounded-full border-4 border-border flex items-center justify-center bg-secondary/30">
            <span className="text-2xl font-semibold text-muted-foreground">HG</span>
          </div>
        )}

        {/* Remove Button */}
        {preview && !uploading && (
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

      {/* Error Message */}
      {error && (
        <p className="text-sm text-red-500 text-center">{error}</p>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        aria-label="Upload avatar"
        disabled={uploading}
      />

      {/* Upload Button */}
      <Button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        variant="outline"
        className="border-primary text-primary hover:bg-secondary/50 gap-2"
        disabled={uploading}
      >
        {uploading ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            Uploading...
          </>
        ) : (
          <>
            <Upload size={16} />
            {preview ? "Change Avatar" : "Upload Avatar"}
          </>
        )}
      </Button>

      <p className="text-xs text-muted-foreground text-center">
        Supported formats: JPG, PNG, GIF (Max 5MB)
      </p>

      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-foreground">
              Remove avatar?
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              This will reset your avatar to the default image.
            </p>
            <div className="mt-6 flex gap-3">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setShowConfirm(false)}
                disabled={removing}
              >
                Cancel
              </Button>
              <Button
                type="button"
                className="flex-1 bg-destructive text-white hover:bg-destructive/90"
                onClick={confirmRemove}
                disabled={removing}
              >
                {removing ? "Removing..." : "Remove"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
