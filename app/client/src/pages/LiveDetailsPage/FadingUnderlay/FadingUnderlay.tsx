import { cn } from "@/lib/utils";

const FadingUnderlay = () => {
  return (
    <div
      className={cn(
        "absolute bottom-0 left-0",
        "h-1/2 w-full",
        "bg-gradient-to-t from-black/60 to-transparent",
      )}
    />
  );
};

export default FadingUnderlay;
