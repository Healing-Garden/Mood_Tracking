import React from 'react';
import { cn } from '../../utils/cn';

interface FormProps extends React.FormHTMLAttributes<HTMLFormElement> {
  children: React.ReactNode;
}

export function Form({ className, ...props }: FormProps) {
  return <form className={cn('space-y-6', className)} {...props} />;
}

interface FormFieldProps {
  children: React.ReactNode;
}

export function FormField({ children }: FormFieldProps) {
  return <div className="space-y-2">{children}</div>;
}

interface FormLabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  children: React.ReactNode;
}

export function FormLabel({ className, ...props }: FormLabelProps) {
  return (
    <label
      className={cn('text-sm font-medium', className)}
      style={{ color: 'var(--color-foreground)' }}
      {...props}
    />
  );
}

interface FormErrorProps {
  message?: string;
}

export function FormError({ message }: FormErrorProps) {
  if (!message) return null;
  return (
    <div
      className="rounded-lg bg-destructive/10 p-3 text-sm"
      style={{ color: 'var(--color-destructive)' }}
    >
      {message}
    </div>
  );
}
