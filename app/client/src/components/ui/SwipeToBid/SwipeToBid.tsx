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

// Particles: [x offset, y offset, rotation degrees]
const PARTICLES: [number, number, number][] = [
  [26, -40, 20],
  [44, -16, -25],
  [44, 16, 40],
  [26, 40, -30],
  [6, -50, 60],
  [6, 50, -60],
];

export default function SwipeToBid({ onConfirm, amount, disabled }: Props) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [trackWidth, setTrackWidth] = useState(0);
  const [popping, setPopping] = useState(false);
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
      setPopping(true);
      setTimeout(() => setPopping(false), 600);
      onConfirm();
      springBack();
    } else {
      springBack();
    }
  };

  return (
    <div className="relative">
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

      {/* Pop particles — rendered outside the overflow-hidden track */}
      {popping &&
        PARTICLES.map(([tx, ty, rotate], i) => (
          <motion.div
            key={i}
            initial={{ x: 0, y: 0, scale: 1, opacity: 1, rotate: 0 }}
            animate={{ x: tx, y: ty, scale: 0, opacity: 0, rotate }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="absolute w-3 h-3 rounded-sm bg-primary pointer-events-none"
            style={{
              right: 10,
              top: "50%",
              marginTop: -6,
            }}
          />
        ))}
    </div>
  );
}
