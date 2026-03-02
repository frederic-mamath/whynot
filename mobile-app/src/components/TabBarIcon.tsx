import type { LucideIcon } from "lucide-react-native";

interface TabBarIconProps {
  icon: LucideIcon;
  color: string;
  size?: number;
  focused?: boolean;
}

export function TabBarIcon({ icon: Icon, color, size = 24 }: TabBarIconProps) {
  return <Icon size={size} color={color} strokeWidth={2} />;
}
