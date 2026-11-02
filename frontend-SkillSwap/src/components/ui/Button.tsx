import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'glass' | 'danger' | 'icon';
}

export function Button({
  variant = 'primary',
  className = '',
  children,
  ...props
}: ButtonProps) {
  const variantClass =
    variant === 'primary'
      ? 'btn btn-primary'
      : variant === 'glass'
      ? 'btn glass-btn'
      : variant === 'danger'
      ? 'btn btn-danger'
      : 'icon-btn';

  return (
    <button className={`${variantClass} ${className}`.trim()} {...props}>
      {children}
    </button>
  );
}
