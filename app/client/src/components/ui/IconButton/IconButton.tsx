import { cn } from "@/lib/utils";

interface Props {
  onClick: () => void;
  icon: React.ReactNode;
  size: number;
  className?: string;
}

const IconButton = ({ className, onClick, icon, size }: Props) => {
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
