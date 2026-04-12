interface Props {
  className?: string;
}

export default function Logo({ className }: Props) {
  return (
    <span className={`font-outfit font-bold text-xl text-primary tracking-tight ${className ?? ""}`}>
      popup
    </span>
  );
}
