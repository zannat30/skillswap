import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
  wrapperClassName?: string;
}

export function Input({
  icon,
  wrapperClassName = '',
  style,
  ...props
}: InputProps) {
  return (
    <div className={`search-bar ${wrapperClassName}`.trim()}>
      {icon}
      <input
        style={!icon ? { paddingLeft: '16px', ...style } : style}
        {...props}
      />
    </div>
  );
}
