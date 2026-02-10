import { useGoogleLogin } from "@react-oauth/google";

interface Props {
  onSuccess: (accessToken: string) => void;
}

export default function GoogleLogin({ onSuccess }: Props) {
  const login = useGoogleLogin({
    scope: "profile email",
    onSuccess: (token) => {
      onSuccess(token.access_token); // ✅ access token
    },
    onError: () => {
      console.error("Google login failed");
    },
  });

  return (
    <button
      type="button"
      onClick={() => login()}
      className="w-full h-11 border rounded-lg flex items-center justify-center gap-2"
    >
      <img
        src="https://developers.google.com/identity/images/g-logo.png"
        className="w-5 h-5"
      />
      Continue with Google
    </button>
  );
}
