import type { ButtonHTMLAttributes } from 'react';
import './Button.css';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export function buttonClassName({ variant = 'primary', size = 'md', className = '' }: Pick<ButtonProps, 'variant' | 'size' | 'className'> = {}) {
  return `ui-button ui-button--${variant} ui-button--${size} ${className}`.trim();
}

export function Button({ variant, size, isLoading = false, disabled, type = 'button', className, children, ...props }: ButtonProps) {
  return (
    <button {...props} type={type} disabled={disabled || isLoading} aria-busy={isLoading || undefined} className={buttonClassName({ variant, size, className })}>
      {isLoading ? 'Working…' : children}
    </button>
  );
}

export default Button;
