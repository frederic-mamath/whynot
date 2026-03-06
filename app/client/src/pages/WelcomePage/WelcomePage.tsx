import AppleIcon from "@/components/Icons/AppleIcon/AppleIcon";
import GoogleIcon from "@/components/Icons/GoogleIcon";
import MailIcon from "@/components/Icons/MailIcon";
import ButtonV2 from "@/components/ui/ButtonV2/ButtonV2";

const WelcomePage = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 py-10">
      <div className="flex flex-col items-center justify-center flex-1 gap-2">
        <div className="font-outfit text-primary font-black text-[42px] tracking-[-1.5px] leading-none">
          popup
        </div>
        <div className="font-syne text-foreground text-[22px] font-extrabold leading-[26px] text-center">
          Achète et vends en live.
        </div>
        <p className="font-outfit text-muted-foreground text-[13px] leading-[18px] text-center">
          Rejoins la communauté de live shopping.
          <br />
          Regarde, achète, vends - en quelques taps.
        </p>
      </div>

      <div className="flex flex-col items-center justify-center gap-[10px] w-full max-w-[327px]">
        <ButtonV2
          href="/auth/apple"
          label="Continuer avec Apple"
          className="bg-white text-black w-full"
          icon={<AppleIcon />}
        />
        <ButtonV2
          href="/auth/google"
          label="Continuer avec Google"
          className="text-white w-full border border-border"
          icon={<GoogleIcon />}
        />

        <div className="flex items-center gap-3 w-full py-1">
          <div className="flex-1 h-px bg-border" />
          <div className="text-border text-sm">OU</div>
          <div className="flex-1 h-px bg-border" />
        </div>

        <ButtonV2
          label="S'inscrire avec un email"
          className="text-primary w-full border border-primary bg-transparent"
          href="/register"
          icon={<MailIcon />}
        />

        <div className="font-outfit text-muted-foreground text-[13px] leading-[18px] flex gap-1">
          <div>Déjà un compte ?</div>
          <a href="/login" className="text-primary">
            Se connecter
          </a>
        </div>
      </div>
    </div>
  );
};

export default WelcomePage;
