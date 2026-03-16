import ButtonV2 from "@/components/ui/ButtonV2";
import IconButton from "@/components/ui/IconButton/IconButton";
import { cn } from "@/lib/utils";
import { Share, Store } from "lucide-react";
import FadingUnderlay from "./FadingUnderlay";

const LiveDetailsPage = () => {
  return (
    <div className="h-full">
      <div
        className={cn(
          "relative",
          "min-h-screen w-full",
          "bg-white",
          "text-black",
        )}
      >
        <FadingUnderlay />
        <div className={cn("absolute bottom-0", "w-full")}>
          <div className={cn("flex")}>
            <div className={cn("flex flex-col flex-1")}>
              <div>Messages</div>
              <div>Input</div>
            </div>
            <div>
              <IconButton
                icon={<Share size={20} />}
                onClick={() => {}}
                size={40}
              />
              <IconButton
                icon={<Store size={20} />}
                onClick={() => {}}
                size={40}
              />
            </div>
          </div>
          <div>Highlighted product</div>
          <ButtonV2 onClick={() => {}} label="Buy now" />
        </div>
      </div>
      <div className={cn("min-h-screen w-full", "bg-white")}>
        <div>Shop</div>
      </div>
    </div>
  );
};

export default LiveDetailsPage;
