import { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, animate } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  onConfirm: () => void;
  amount: number;
  disabled?: boolean;
}

const THUMB_SIZE = 48;
const THRESHOLD = 0.8;

export default function SwipeToBid({ onConfirm, amount, disabled }: Props) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [trackWidth, setTrackWidth] = useState(0);
  const x = useMotionValue(0);
  const maxDrag = Math.max(0, trackWidth - THUMB_SIZE - 8);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const observer = new ResizeObserver(() => {
      setTrackWidth(el.offsetWidth);
    });
    observer.observe(el);
    setTrackWidth(el.offsetWidth);
    return () => observer.disconnect();
  }, []);

  const springBack = () => {
    animate(x, 0, { type: "spring", stiffness: 400, damping: 30 });
  };

  const handleDragEnd = () => {
    if (maxDrag > 0 && x.get() >= maxDrag * THRESHOLD) {
      onConfirm();
      springBack();
    } else {
      springBack();
    }
  };

  return (
    <div
      ref={trackRef}
      className={cn(
        "relative flex items-center",
        "h-14 rounded-full",
        "bg-card border border-border",
        "overflow-hidden select-none",
        disabled && "opacity-50 pointer-events-none",
      )}
    >
      <div className="absolute inset-0 flex items-center justify-center gap-1 pointer-events-none">
        <span className="text-sm font-semibold text-foreground pl-10">
          Enchèrir — {amount}€
        </span>
        <div className="flex items-center">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              animate={{ opacity: [0.2, 1, 0.2] }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                delay: i * 0.2,
                ease: "easeInOut",
              }}
            >
              <ChevronRight size={16} className="text-foreground opacity-40" />
            </motion.div>
          ))}
        </div>
      </div>

      <motion.div
        drag={disabled ? false : "x"}
        dragConstraints={{ left: 0, right: maxDrag }}
        dragElastic={0}
        dragMomentum={false}
        style={{ x }}
        onDragEnd={handleDragEnd}
        className={cn(
          "absolute left-1 z-10",
          "w-12 h-12 rounded-full",
          "bg-primary text-primary-foreground",
          "flex items-center justify-center",
          "cursor-grab active:cursor-grabbing",
        )}
      >
        <ChevronRight size={20} />
      </motion.div>
    </div>
  );
}
