interface Props {
  icon?: React.ReactNode;
  href?: string;
  label: string;
  style?: React.CSSProperties;
}

const ButtonV2 = ({ icon, label, href, style }: Props) => {
  return (
    <button
      style={{
        display: "flex",
        paddingTop: "14px",
        paddingBottom: "14px",
        justifyContent: "center",
        alignItems: "center",
        gap: "8px",
        borderRadius: "28px",
        ...style,
      }}
    >
      <a href={href}>
        <div>{icon}</div>
        <div>{label}</div>
      </a>
    </button>
  );
};

export default ButtonV2;
