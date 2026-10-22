import { AP_TIERS } from "@/config/scales";

export const controlClass =
  "h-11 w-full rounded-sm border bg-background px-3 text-sm text-foreground outline-none focus:border-foreground";

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium">{label}</span>
      {children}
    </label>
  );
}

export function TierSelect({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <Field label={label}>
      <select value={value} onChange={(e) => onChange(e.target.value)} className={controlClass}>
        <option value="">Select</option>
        {AP_TIERS.map((tier) => (
          <option key={tier.id} value={tier.id}>
            {tier.id} {tier.label}
          </option>
        ))}
      </select>
    </Field>
  );
}