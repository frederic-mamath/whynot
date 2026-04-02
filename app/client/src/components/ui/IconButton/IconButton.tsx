import { cn } from "@/lib/utils";

interface Props {
  onClick: () => void;
  icon: React.ReactNode;
  size: number;
  className?: string;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
}

const IconButton = ({ className, onClick, icon, size, type = "button", disabled }: Props) => {
  const borderRadius = `${size / 2}px`;

  return (
    <button
      className={cn(
        "flex items-center justify-center",
        `border-1 border-solid border-divider`,
        `cursor-pointer`,
        className,
      )}
      onClick={onClick}
      type={type}
      disabled={disabled}
      style={{
        height: size,
        width: size,
        borderRadius,
      }}
    >
      {icon}
    </button>
  );
};

export default IconButton;
