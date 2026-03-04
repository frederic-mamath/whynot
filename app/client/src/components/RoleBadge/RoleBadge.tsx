import { useTranslation } from "react-i18next";
import { Badge } from "../ui/badge";
import { Crown, Eye } from "lucide-react";

interface RoleBadgeProps {
  role: string;
  className?: string;
}

export function RoleBadge({ role, className }: RoleBadgeProps) {
  const { t } = useTranslation();
  if (role === "seller") {
    return (
      <Badge variant="default" className={className}>
        <Crown className="w-3 h-3" />
        {t("roles.broadcaster")}
      </Badge>
    );
  }

  if (role === "buyer") {
    return (
      <Badge variant="secondary" className={className}>
        <Eye className="w-3 h-3" />
        {t("roles.viewer")}
      </Badge>
    );
  }

  return null;
}
