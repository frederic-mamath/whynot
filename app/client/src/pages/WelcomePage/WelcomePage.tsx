import ButtonV2 from "@/components/ui/ButtonV2/ButtonV2";

const WelcomePage = () => {
  return (
    <div>
      <div>Popup</div>
      <div>Achète et vends en live.</div>
      <div>Rejoins la communauté de live shopping.</div>
      <div>Regarde, achète, vends - en quelques taps.</div>
      <ButtonV2 label="Continuer avec Apple" />
      <ButtonV2 label="Continuer avec Google" />
      <div>OU</div>
      <ButtonV2 label="S'inscrire avec un email" />
      <div>
        <div>Déjà un compte ?</div>
        <button>Se connecter</button>
      </div>
    </div>
  );
};

export default WelcomePage;
