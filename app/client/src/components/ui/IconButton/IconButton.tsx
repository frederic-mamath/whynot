import { cn } from "@/lib/utils";

interface Props {
  onClick: () => void;
  icon: React.ReactNode;
  size: number;
}

const IconButton = ({ onClick, icon, size }: Props) => {
  return (
    <button
      className={cn(
        "flex items-center justify-center",
        `border-1 rounded-[${size / 2}px] border-divider`,
      )}
      onClick={onClick}
      style={{
        height: size,
        width: size,
      }}
    >
      {icon}
    </button>
  );
};

export default IconButton;
