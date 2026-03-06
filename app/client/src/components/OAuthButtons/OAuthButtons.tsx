import AppleIcon from "@/components/Icons/AppleIcon/AppleIcon";
import ButtonV2 from "@/components/ui/ButtonV2";
import GoogleIcon from "@/components/Icons/GoogleIcon";

export default function OAuthButtons() {
  return (
    <>
      <ButtonV2
        href="/auth/apple"
        label="Continuer avec Apple"
        className="bg-white text-black w-full font-bold"
        icon={<AppleIcon />}
      />
      <ButtonV2
        href="/auth/google"
        label="Continuer avec Google"
        className="text-white w-full border border-border bg-[rgb(26,_26,_26)] font-bold"
        icon={<GoogleIcon />}
      />
    </>
  );
}
