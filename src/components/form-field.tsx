import { Label } from "@/components/ui/label";

// Label + control + optional hint, with the spacing used across all forms.
export function FormField({
  id,
  label,
  hint,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id} className="pl-1 font-semibold">
        {label}
      </Label>
      {children}
      {hint && <p className="pl-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function FormError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="rounded-2xl bg-destructive/10 px-3 py-2 text-sm text-destructive">
      {message}
    </p>
  );
}
