import { Avatar, AvatarFallback } from "@/components/ui/avatar";

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function EmployeeAvatar({ name, size = "default" }: { name: string; size?: "sm" | "default" | "lg" }) {
  return (
    <Avatar size={size}>
      <AvatarFallback>{initials(name)}</AvatarFallback>
    </Avatar>
  );
}
