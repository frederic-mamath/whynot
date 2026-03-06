import MailIcon from "@/components/Icons/MailIcon";
import ButtonV2 from "@/components/ui/ButtonV2/ButtonV2";
import OAuthButtons from "@/components/OAuthButtons";
import OrDivider from "@/components/OrDivider/OrDivider";
import { Link } from "react-router-dom";

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
        <OAuthButtons />
        <OrDivider />
        <ButtonV2
          label="S'inscrire avec un email"
          className="text-primary w-full border border-primary bg-transparent font-bold"
          href="/register"
          icon={<MailIcon />}
        />

        <div className="font-outfit text-muted-foreground text-[13px] leading-[18px] flex gap-1">
          <div>Déjà un compte ?</div>
          <Link to="/login" className="text-primary">
            Se connecter
          </Link>
        </div>
      </div>
    </div>
  );
};

export default WelcomePage;
