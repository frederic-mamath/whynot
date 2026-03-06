import { useId, useRef } from "react";

interface Props {
  icon: React.ReactNode;
  label: string;
  type: React.HTMLInputTypeAttribute;
  placeholder?: string;
  description?: string;
}

const Input = ({ icon, label, placeholder, type, description }: Props) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = useId();

  return (
    <div>
      <label htmlFor={inputId}>{label}</label>
      <div onClick={() => inputRef.current?.focus()}>
        <div>{icon}</div>
        <input
          id={inputId}
          ref={inputRef}
          type={type}
          placeholder={placeholder}
        />
      </div>
      {description && <p>{description}</p>}
    </div>
  );
};

export default Input;
