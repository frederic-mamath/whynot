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
    <div className="has-[input:focus]:ring-2 has-[input:focus]:ring-primary-600 has-[input:focus]:border-transparent">
      <label htmlFor={inputId}>{label}</label>
      <div onClick={() => inputRef.current?.focus()}>
        <div>{icon}</div>
        <input
          className="[:focus]:border-transparent"
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
