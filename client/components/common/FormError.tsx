import { useEffect, useRef } from 'react';

export function FormError({ message }: { message: string | null }) {
  const ref = useRef<HTMLParagraphElement>(null);
  useEffect(() => { if (message) ref.current?.focus(); }, [message]);
  if (!message) return null;
  return <p ref={ref} role="alert" tabIndex={-1} className="rounded-md border border-destructive bg-danger-soft p-3 text-sm text-danger-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring">{message}</p>;
}
