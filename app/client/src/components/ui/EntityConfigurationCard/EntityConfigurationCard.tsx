import Placeholder from "@/components/ui/Placeholder/Placeholder";

type PlaceholderProps = React.ComponentProps<typeof Placeholder>;

interface EntityConfigurationCardProps {
  Icon: React.ReactNode;
  title: string;
  description: string;
  PlaceholderProps: PlaceholderProps;
  children?: React.ReactNode;
}

export default function EntityConfigurationCard({
  Icon,
  title,
  description,
  PlaceholderProps,
  children,
}: EntityConfigurationCardProps) {
  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-4">
      <div className="flex items-center gap-2">
        {Icon}
        <h2 className="text-base font-syne font-bold text-foreground">{title}</h2>
      </div>
      <p className="text-sm text-muted-foreground">{description}</p>
      {children ?? <Placeholder {...PlaceholderProps} />}
    </div>
  );
}
