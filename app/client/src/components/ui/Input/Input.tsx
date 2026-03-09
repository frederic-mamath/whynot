import { cn } from "@/lib/utils";
import { useId, useRef } from "react";

interface Props {
  className?: string;
  hint?: string;
  icon: React.ReactNode;
  label: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type: React.HTMLInputTypeAttribute;
}

const Input = ({
  className,
  hint,
  icon,
  label,
  onChange,
  placeholder,
  type,
}: Props) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = useId();

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <label
        className={cn("text-muted-foreground text-[11px] font-semibold")}
        htmlFor={inputId}
      >
        {label}
      </label>
      <div
        onClick={() => inputRef.current?.focus()}
        className={cn(
          "border-2 border-[rgb(51,_51,_51)] rounded-[14px] has-[input:focus]:ring-2 has-[input:focus]:ring-primary",
          "transition-shadow duration-200 ease-in",
          "flex items-center",
          "gap-4 p-3",
        )}
      >
        <div>{icon}</div>
        <input
          className="focus:outline-none flex-1"
          id={inputId}
          ref={inputRef}
          type={type}
          placeholder={placeholder}
          onChange={(e) => onChange?.(e.target.value)}
        />
      </div>
      {hint && <p className="text-[10px] text-hint">{hint}</p>}
    </div>
  );
};

export default Input;
