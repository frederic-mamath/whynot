import ButtonV2 from "@/components/ui/ButtonV2/ButtonV2";

const WelcomePage = () => {
  return (
    <div
      style={{
        paddingLeft: "24px",
        paddingRight: "24px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
      }}
    >
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
      <p
        style={{
          fontFamily: "Outfit, sans-serif",
          color: "rgb(119, 119, 119)",
          fontSize: "13px",
          lineHeight: "18px",
          textAlign: "center",
        }}
      >
        Rejoins la communauté de live shopping.
        <br />
        Regarde, achète, vends - en quelques taps.
      </p>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          gap: "10px",
          width: "100%",
          maxWidth: "327px",
        }}
      >
        <ButtonV2
          href="/auth/apple"
          label="Continuer avec Apple"
          style={{
            backgroundColor: "rgb(255, 255, 255)",
            color: "rgb(0, 0, 0)",
            width: "100%",
          }}
        />
        <ButtonV2
          href="/auth/google"
          label="Continuer avec Google"
          style={{
            backgroundColor: "rgb(26, 26, 26)",
            color: "rgb(240, 240, 232)",
            width: "100%",
            borderColor: "rgb(51, 51, 51)",
            borderWidth: "1px",
            borderStyle: "solid",
          }}
        />
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            width: "100%",
            maxWidth: "327px",
          }}
        >
          <div
            style={{
              flex: 1,
              height: "1px",
              backgroundColor: "rgb(68, 68, 68)",
            }}
          />
          <div style={{ color: "rgb(68, 68, 68)" }}>OU</div>
          <div
            style={{
              flex: 1,
              height: "1px",
              backgroundColor: "rgb(68, 68, 68)",
            }}
          />
        </div>
        <ButtonV2
          label="S'inscrire avec un email"
          style={{
            color: "rgb(224, 255, 0)",
            width: "100%",
            borderColor: "rgb(224, 255, 0)",
            borderWidth: "1px",
            borderStyle: "solid",
          }}
        />
      </div>
      <div
        style={{
          fontFamily: "Outfit, sans-serif",
          color: "rgb(119, 119, 119)",
          fontSize: "13px",
          lineHeight: "18px",
          display: "flex",
          gap: "4px",
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
