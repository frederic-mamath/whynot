import { cn } from "@/lib/utils";

const FadingUnderlay = () => {
  return (
    <div
      className={cn(
        "absolute bottom-0 left-0",
        "h-2/3   w-full",
        "bg-gradient-to-t from-black/60 to-transparent",
      )}
    />
  );
};

export default FadingUnderlay;
