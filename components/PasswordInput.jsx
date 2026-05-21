import { useState } from 'react';
import { FaEye, FaEyeSlash, FaLock } from 'react-icons/fa';

const DEFAULT_BOX =
  'w-full border border-gray-300 rounded-md bg-white focus-within:outline-none focus-within:ring-2 focus-within:ring-nex-orange focus-within:border-transparent';

/**
 * CRM password field — lock and eye icons inside the input box border.
 */
export default function PasswordInput({
  value,
  onChange,
  placeholder = 'Password',
  className = '',
  boxClassName = DEFAULT_BOX,
  inputClassName = '',
  disabled = false,
  required = false,
  minLength,
  id,
  name,
  autoComplete,
  showLockIcon = false,
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className={`flex items-center ${boxClassName} ${className}`}>
      {showLockIcon && (
        <span className="flex items-center pl-3 text-gray-400 shrink-0 pointer-events-none">
          <FaLock size={14} aria-hidden />
        </span>
      )}
      <input
        id={id}
        name={name}
        type={visible ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        minLength={minLength}
        autoComplete={autoComplete}
        className={`flex-1 min-w-0 border-0 bg-transparent outline-none focus:ring-0 py-2 text-base disabled:opacity-50 ${
          showLockIcon ? 'pl-2' : 'pl-3'
        } pr-1 ${inputClassName}`}
      />
      <button
        type="button"
        tabIndex={-1}
        disabled={disabled}
        aria-label={visible ? 'Hide password' : 'Show password'}
        className="flex items-center justify-center shrink-0 px-3 py-2 text-gray-500 hover:text-gray-700 disabled:opacity-40 border-0 bg-transparent"
        onClick={() => setVisible((v) => !v)}
      >
        {visible ? <FaEyeSlash size={16} aria-hidden /> : <FaEye size={16} aria-hidden />}
      </button>
    </div>
  );
}
