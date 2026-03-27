// src/components/ui/Badge.tsx

interface BadgeProps {
  label: string;
  variant?: "default" | "gender" | "season" | "tag";
}

const variantClass: Record<string, string> = {
  default: "bg-gray-100 text-gray-600",
  gender: "bg-blue-100 text-blue-700",
  season: "bg-green-100 text-green-700",
  tag: "bg-purple-100 text-purple-700",
};

export const Badge = ({ label, variant = "default" }: BadgeProps) => {
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${variantClass[variant]}`}
    >
      {label}
    </span>
  );
};
