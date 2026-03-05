import ButtonV2 from "@/components/ui/ButtonV2/ButtonV2";

const WelcomePage = () => {
  return (
    <div>
      <div
        style={{
          color: "rgb(224, 255, 0)",
          fontSize: "42px",
          fontFamily: "Outfit, sans-serif",
          fontWeight: 900,
          letterSpacing: "-1.5px",
        }}
      >
        popup
      </div>
      <div
        style={{
          fontFamily: "Syne, sans-serif",
          color: "rgb(240, 240, 232)",
          fontSize: "22px",
          fontWeight: 800,
          lineHeight: "26px",
        }}
      >
        Achète et vends en live.
      </div>
      <div
        style={{
          fontFamily: "Outfit, sans-serif",
          color: "rgb(119, 119, 119)",
          fontSize: "13px",
          lineHeight: "18px",
        }}
      >
        <div>Rejoins la communauté de live shopping.</div>
        <div>Regarde, achète, vends - en quelques taps.</div>
      </div>
      <ButtonV2 label="Continuer avec Apple" />
      <ButtonV2 label="Continuer avec Google" />
      <div>OU</div>
      <ButtonV2 label="S'inscrire avec un email" />
      <div
        style={{
          fontFamily: "Outfit, sans-serif",
          color: "rgb(119, 119, 119)",
          fontSize: "13px",
          lineHeight: "18px",
        }}
      >
        <div>Déjà un compte ?</div>
        <button
          style={{
            color: "rgb(224, 255, 0)",
          }}
        >
          Se connecter
        </button>
      </div>
    </div>
  );
};

export default WelcomePage;
