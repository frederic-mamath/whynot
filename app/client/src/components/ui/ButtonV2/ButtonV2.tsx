import { cn } from "@/lib/utils";

interface Props {
  icon?: React.ReactNode;
  href?: string;
  label: string;
  className?: string;
}

const ButtonV2 = ({ icon, label, href, className }: Props) => {
  return (
    <button
      className={cn(
        "relative overflow-hidden transition-colors",
        "before:pointer-events-none before:absolute before:inset-0 before:bg-white/10 before:opacity-0 before:transition-opacity hover:before:opacity-100 hover:cursor-pointer",
        "flex items-center justify-center gap-2 rounded-[28px]",
        className,
      )}
    >
      <a
        href={href}
        className="py-[14px] w-full text-center flex items-center justify-center gap-2 text-[13px]"
      >
        <div>{icon}</div>
        <div>{label}</div>
      </a>
    </button>
  );
};

export default ButtonV2;
