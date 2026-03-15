import { cn } from "@/lib/utils";

interface Props {
  icon?: React.ReactNode;
  href?: string;
  label: string;
  className?: string;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
}

const ButtonV2 = ({
  icon,
  label,
  href,
  className,
  onClick,
  type = "button",
  disabled,
}: Props) => {
  const innerContent = (
    <span className="w-full text-center flex items-center justify-center gap-2 text-[13px]">
      {icon && <span>{icon}</span>}
      <span>{label}</span>
    </span>
  );

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "relative overflow-hidden transition-colors",
        "before:pointer-events-none before:absolute before:inset-0 before:bg-white/10 before:opacity-0 before:transition-opacity hover:before:opacity-100 hover:cursor-pointer",
        "flex items-center justify-center gap-2 rounded-[28px]",
        "py-[14px]",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        className,
      )}
    >
      {href ? (
        <a href={href} className="w-full">
          {innerContent}
        </a>
      ) : (
        innerContent
      )}
    </button>
  );
};

export default ButtonV2;
