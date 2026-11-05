import type { ButtonHTMLAttributes } from 'react';
import './Button.css';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export default function Button({ variant = 'primary', size = 'md', isLoading = false, disabled, type = 'button', className = '', children, ...props }: ButtonProps) {
  return (
    <button {...props} type={type} disabled={disabled || isLoading} aria-busy={isLoading || undefined} className={`ui-button ui-button--${variant} ui-button--${size} ${className}`.trim()}>
      {isLoading ? 'Working…' : children}
    </button>
  );
}
