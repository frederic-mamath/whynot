import { cn } from "@/lib/utils";

interface Props {
  className?: string;
  selectedTabId: string;
  items: Array<{
    id: string;
    label: string;
  }>;
  onClickItem: (id: string) => void;
}

const Tabs = ({ className, selectedTabId, items, onClickItem }: Props) => {
  return (
    <div className={cn("flex w-full", className)}>
      {items.map((item) => (
        <button
          key={item.id}
          className={cn(
            "flex-1",
            "text-center",
            "py-2",
            "cursor-pointer",
            "transition-colors",
            "font-bold",
            "box-shadow-[0_2px_0_0_transparent]",
            {
              "[box-shadow:0_2px_0_0_#d4ff33]": item.id === selectedTabId,
              "text-primary": item.id === selectedTabId,
              "text-muted": item.id !== selectedTabId,
            },
          )}
          onClick={() => onClickItem(item.id)}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
};

export default Tabs;
