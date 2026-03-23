import { cn } from "@/lib/utils";
import { useId, useRef } from "react";

interface Props {
  className?: string;
  borderClassName?: string;
  inputClassName?: string;
  hint?: string;
  icon?: React.ReactNode;
  label?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type: React.HTMLInputTypeAttribute | "textarea" | "image";
  rows?: number;
  value?: string;
  name?: string;
  disabled?: boolean;
  onKeyDown?: React.KeyboardEventHandler<HTMLInputElement | HTMLTextAreaElement>;
  maxLength?: number;
  step?: string | number;
  min?: string | number;
  autoComplete?: string;
  autoCapitalize?: string;
  required?: boolean;
}

const Input = ({
  className,
  borderClassName,
  inputClassName,
  hint,
  icon,
  label,
  onChange,
  placeholder,
  type,
  rows = 4,
  value,
  name,
  disabled,
  onKeyDown,
  maxLength,
  step,
  min,
  autoComplete,
  autoCapitalize,
  required,
}: Props) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputId = useId();

  const isTextarea = type === "textarea";
  const isImage = type === "image";

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = ev.target?.result as string;
      onChange(base64);
    };
    reader.readAsDataURL(file);
    // Reset so the same file can be re-selected
    e.target.value = "";
  };

  if (isImage) {
    return (
      <div className={cn("flex flex-col gap-2", className)}>
        {label && (
          <label
            className="text-muted-foreground text-[11px] font-semibold"
            htmlFor={inputId}
          >
            {label}
          </label>
        )}
        <label
          htmlFor={inputId}
          className={cn(
            "relative block w-full rounded-[14px] overflow-hidden cursor-pointer",
            "border-2 transition-colors duration-200",
            value
              ? "border-solid border-[rgb(51,_51,_51)]"
              : "border-dashed border-[rgb(51,_51,_51)]",
            !value && "flex items-center justify-center py-10",
          )}
        >
          {value ? (
            <img
              src={value}
              alt="Aperçu"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <span className="text-4xl">📷</span>
              <span className="text-sm">
                {placeholder ?? "Ajouter une photo"}
              </span>
            </div>
          )}
          <input
            id={inputId}
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
        </label>
        {hint && <p className="text-[10px] text-hint">{hint}</p>}
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <label
        className={cn("text-muted-foreground text-[11px] font-semibold")}
        htmlFor={inputId}
      >
        {label}
      </label>
      <div
        onClick={() =>
          isTextarea ? textareaRef.current?.focus() : inputRef.current?.focus()
        }
        className={cn(
          "border-2 border-[rgb(51,_51,_51)] rounded-[14px]",
          borderClassName,
          isTextarea
            ? "has-[textarea:focus]:ring-2 has-[textarea:focus]:ring-primary"
            : "has-[input:focus]:ring-2 has-[input:focus]:ring-primary",
          "transition-shadow duration-200 ease-in",
          "flex items-center",
          "gap-4 p-3",
          disabled && "opacity-50 cursor-not-allowed",
        )}
      >
        {icon && <div>{icon}</div>}
        {isTextarea ? (
          <textarea
            className={cn(
              "focus:outline-none flex-1 resize-none bg-transparent align-top",
              inputClassName,
            )}
            id={inputId}
            ref={textareaRef}
            placeholder={placeholder}
            rows={rows}
            value={value}
            disabled={disabled}
            onKeyDown={onKeyDown as React.KeyboardEventHandler<HTMLTextAreaElement>}
            maxLength={maxLength}
            onChange={(e) => onChange?.(e.target.value)}
          />
        ) : (
          <input
            className={cn("focus:outline-none flex-1", inputClassName)}
            id={inputId}
            ref={inputRef}
            type={type}
            placeholder={placeholder}
            value={value}
            name={name}
            disabled={disabled}
            onKeyDown={onKeyDown as React.KeyboardEventHandler<HTMLInputElement>}
            maxLength={maxLength}
            step={step}
            min={min}
            autoComplete={autoComplete}
            autoCapitalize={autoCapitalize}
            required={required}
            onChange={(e) => onChange?.(e.target.value)}
          />
        )}
      </div>
      {hint && <p className="text-[10px] text-hint">{hint}</p>}
    </div>
  );
};

export default Input;
