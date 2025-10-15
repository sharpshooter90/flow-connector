import React from "react";

interface TextInputProps {
  value: string;
  onChange: (value: string) => void;
  label: string;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
}

const TextInput = React.forwardRef<HTMLInputElement, TextInputProps>(
  ({ value, onChange, label, placeholder, disabled = false, error }, ref) => {
    return (
      <div className="space-y-2 relative">
        <label className="block text-[10px] font-semibold text-gray-700 uppercase tracking-wide">
          {label}
        </label>
        <input
          ref={ref}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className={`
          w-full bg-gray-100 border border-gray-200 rounded text-xs px-3 py-2 text-gray-700 
          focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent
          ${error ? "border-red-300 bg-red-50" : ""}
          ${
            disabled
              ? "bg-gray-100 cursor-not-allowed opacity-50"
              : "hover:border-gray-300"
          }
        `}
        />
        {error && <p className="text-[10px] text-red-600">{error}</p>}
      </div>
    );
  }
);

TextInput.displayName = "TextInput";

export default TextInput;
