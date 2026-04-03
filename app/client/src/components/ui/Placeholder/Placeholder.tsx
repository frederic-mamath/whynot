import ButtonV2 from "@/components/ui/ButtonV2";
import { cn } from "@/lib/utils";

interface PlaceholderProps {
  Icon: React.ReactNode;
  title: string;
  ButtonListProps?: React.ComponentProps<typeof ButtonV2>[];
}

export default function Placeholder({ Icon, title, ButtonListProps }: PlaceholderProps) {
  return (
    <div className={cn("flex flex-col items-center text-center py-6 gap-4")}>
      <div className="text-muted-foreground">{Icon}</div>
      <p className="text-sm font-medium text-foreground">{title}</p>
      {ButtonListProps && ButtonListProps.length > 0 && (
        <div className="flex flex-col gap-3 w-full">
          {ButtonListProps.map((props, i) => (
            <ButtonV2 key={i} {...props} />
          ))}
        </div>
      )}
    </div>
  );
}
