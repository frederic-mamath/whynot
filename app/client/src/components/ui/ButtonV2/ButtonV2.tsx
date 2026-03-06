interface Props {
  icon?: React.ReactNode;
  href?: string;
  label: string;
  style?: React.CSSProperties;
}

const ButtonV2 = ({ icon, label, href, style }: Props) => {
  return (
    <button
      className="relative overflow-hidden transition-colors before:pointer-events-none before:absolute before:inset-0 before:bg-white/10 before:opacity-0 before:transition-opacity hover:before:opacity-100 hover:cursor-pointer"
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        gap: "8px",
        borderRadius: "28px",
        ...style,
      }}
    >
      <a
        href={href}
        style={{
          marginTop: "14px",
          marginBottom: "14px",
          width: "100%",
        }}
      >
        <div>{icon}</div>
        <div>{label}</div>
      </a>
    </button>
  );
};

export default ButtonV2;
