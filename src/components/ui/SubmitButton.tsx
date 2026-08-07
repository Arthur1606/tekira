'use client';

import { useFormStatus } from 'react-dom';
import { Button } from './Button';

interface SubmitButtonProps {
  children: React.ReactNode;
  className?: string;
  fullWidth?: boolean;
  variant?: 'primary' | 'secondary' | 'ghost';
  disabled?: boolean;
}

export function SubmitButton({ children, className = '', fullWidth = false, variant = 'primary', disabled = false }: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <Button 
      type="submit" 
      isLoading={pending} 
      fullWidth={fullWidth} 
      variant={variant}
      disabled={disabled || pending}
      className={className}
    >
      {children}
    </Button>
  );
}
