import * as React from 'react';
import { cn } from '../../lib/cn';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, ...props }, ref) => {
  return (
    <input
      ref={ref}
      className={cn(
        'flex h-10 w-full rounded-[12px] border border-white/40 bg-white/80 backdrop-blur-md px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-[#5F5F5F] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D7D46]/40 disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      {...props}
    />
  );
});
Input.displayName = 'Input';

export { Input };
