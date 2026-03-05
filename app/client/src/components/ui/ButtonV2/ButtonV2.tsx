interface Props {
  icon?: React.ReactNode;
  label: string;
}

const ButtonV2 = ({ icon, label }: Props) => {
  return (
    <button>
      <div>{icon}</div>
      <div>{label}</div>
    </button>
  );
};

export default ButtonV2;
