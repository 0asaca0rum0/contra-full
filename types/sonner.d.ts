declare module 'sonner' {
  import * as React from 'react';
  export interface ToasterProps {
    position?: string;
    dir?: 'ltr' | 'rtl';
    richColors?: boolean;
    closeButton?: boolean;
  }
  export const Toaster: React.FC<ToasterProps>;
  export function toast(message: string, opts?: any): void;
}
