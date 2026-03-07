export const CLOUDINARY_UPLOAD_URL = "https://api.cloudinary.com/v1_1/difg4vgbw/auto/upload";
export const JOURNAL_PRESET = "journal_unsigned";
export const AVATAR_PRESET = "avatars_unsigned"; // I will assume this preset exists or create it

export const uploadToCloudinary = async (file: File, preset: string = JOURNAL_PRESET) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", preset);

  const res = await fetch(CLOUDINARY_UPLOAD_URL, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error?.message || "Upload failed");
  }

  const data = await res.json();

  if (!data.secure_url) {
    throw new Error("Cloudinary did not return URL");
  }

  console.log("Uploaded to Cloudinary:", data.secure_url);
  return data.secure_url;
};
