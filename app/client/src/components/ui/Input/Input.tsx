import { cn } from "@/lib/utils";
import { useId, useRef } from "react";

interface Props {
  className?: string;
  description?: string;
  icon: React.ReactNode;
  label: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type: React.HTMLInputTypeAttribute;
}

const Input = ({
  className,
  description,
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
          "flex items-center",
          "gap-4 p-3",
        )}
      >
        <div>{icon}</div>
        <input
          className="focus:outline-none"
          id={inputId}
          ref={inputRef}
          type={type}
          placeholder={placeholder}
          onChange={(e) => onChange?.(e.target.value)}
        />
      </div>
      {description && <p>{description}</p>}
    </div>
  );
};

export default Input;
