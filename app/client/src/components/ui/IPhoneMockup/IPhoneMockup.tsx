/**
 * IPhoneMockup — design-system component
 *
 * Renders an iPhone 15/16-style frame with:
 *  - `pictureUrl`       → fills the screen area (object-cover)
 *  - `floatingElements` → array of React nodes that orbit around the phone
 *
 * Animation architecture (hybrid for maximum performance):
 *  - Orbital rotation  → pure CSS @keyframes (GPU compositor thread, zero JS per frame)
 *  - 3D tilt on hover  → Framer Motion useSpring (spring physics, fires only on mousemove)
 *
 * Known trade-offs / downsides:
 *  1. prefers-reduced-motion — orbit is paused via CSS media query; tilt is
 *     skipped via useReducedMotion(). Required for WCAG 2.1 vestibular safety.
 *  2. Distraction — keep floatingElements count ≤ 6 and orbit speed slow (8–12s)
 *     so elements don't compete with the hero copy.
 *  3. transformStyle: preserve-3d creates a new stacking context. Floating elements
 *     must live inside the 3D scene to tilt with the phone.
 *  4. Mouse tilt is desktop-only (onMouseMove doesn't fire on touch screens).
 *  5. Container uses overflow: visible — parent must have enough space for the orbit
 *     to extend beyond the phone's bounding box.
 */

import { useRef } from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  useReducedMotion,
} from "motion/react";
import { cn } from "@/lib/utils";

interface IPhoneMockupProps {
  pictureUrl?: string;
  floatingElements?: React.ReactNode[];
  className?: string;
}

// Orbit radius from phone center (px). The orbit container is scaled on Y
// to produce an ellipse — see @keyframes orbit in index.css.
const ORBIT_RADIUS = 155;

// Base orbit durations per slot (seconds). Varied slightly so elements feel
// organic rather than lockstep.
const ORBIT_DURATIONS = [10, 12, 11, 13, 10.5, 12.5];

export function IPhoneMockup({
  pictureUrl,
  floatingElements = [],
  className,
}: IPhoneMockupProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();

  // Framer Motion spring values for the 3D tilt
  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);
  const springX = useSpring(rotateX, { stiffness: 200, damping: 25 });
  const springY = useSpring(rotateY, { stiffness: 200, damping: 25 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (shouldReduceMotion) return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const dx = (e.clientX - rect.left - rect.width / 2) / (rect.width / 2);
    const dy = (e.clientY - rect.top - rect.height / 2) / (rect.height / 2);
    rotateY.set(dx * 14); // ±14° horizontal tilt
    rotateX.set(-dy * 8); // ±8° vertical tilt (asymmetric — feels natural)
  };

  const handleMouseLeave = () => {
    rotateX.set(0);
    rotateY.set(0);
  };

  return (
    <motion.div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX: shouldReduceMotion ? 0 : springX,
        rotateY: shouldReduceMotion ? 0 : springY,
        transformPerspective: 1000,
      }}
      className={cn(
        // Size the container to accommodate the orbit on all sides
        "relative flex items-center justify-center",
        "w-[360px] h-[520px] sm:w-[420px] sm:h-[600px]",
        // overflow:visible so orbiting elements extend beyond the div bounds
        "overflow-visible",
        className,
      )}
    >
      {/* ── Orbit ring (scaled on Y to form an ellipse) ── */}
      {floatingElements.length > 0 && (
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ transform: "scaleY(1.6)" }}
        >
          {floatingElements.map((el, i) => {
            const fraction = i / floatingElements.length;
            const duration = ORBIT_DURATIONS[i % ORBIT_DURATIONS.length];
            // Negative delay sets the initial angle: fraction × duration seconds
            // into the animation, placing element at the correct orbit position.
            const delay = -(fraction * duration);

            return (
              <div
                key={i}
                className="animate-orbit absolute"
                style={
                  {
                    "--orbit-x": `${ORBIT_RADIUS}px`,
                    "--orbit-duration": `${duration}s`,
                    animationDuration: `${duration}s`,
                    animationDelay: `${delay}s`,
                    animationTimingFunction: "linear",
                    animationIterationCount: "infinite",
                    // The counter-scaleY (0.625 = 1/1.6) is applied inside the
                    // @keyframes itself to keep the element face-up and correct size.
                  } as React.CSSProperties
                }
              >
                {el}
              </div>
            );
          })}
        </div>
      )}

      {/* ── iPhone frame ── */}
      <div
        className={cn(
          // Outer shell — dark charcoal matching iPhone chassis
          "relative z-10",
          "w-[200px] h-[420px] sm:w-[240px] sm:h-[500px]",
          "rounded-[48px] sm:rounded-[52px]",
          "bg-[#1c1c1e]",
          // Metallic edge: two rings — outer highlight, inner shadow
          "ring-1 ring-white/[0.12]",
          "shadow-[0_0_0_2px_#0a0a0a,0_32px_64px_-12px_rgba(0,0,0,0.8)]",
        )}
      >
        {/* Side buttons — volume (left) */}
        <div className="absolute -left-[3px] top-[88px] w-[3px] h-7 bg-[#2c2c2e] rounded-l-sm" />
        <div className="absolute -left-[3px] top-[124px] w-[3px] h-10 bg-[#2c2c2e] rounded-l-sm" />
        <div className="absolute -left-[3px] top-[172px] w-[3px] h-10 bg-[#2c2c2e] rounded-l-sm" />
        {/* Side button — power (right) */}
        <div className="absolute -right-[3px] top-[120px] w-[3px] h-16 bg-[#2c2c2e] rounded-r-sm" />

        {/* Screen bezel + content */}
        <div className="absolute inset-[3px] rounded-[45px] sm:rounded-[49px] overflow-hidden bg-[#0a0a0a]">
          {/* Dynamic Island */}
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20">
            <div className="w-[88px] h-[28px] bg-black rounded-full" />
          </div>

          {/* Screen content */}
          {pictureUrl ? (
            <img
              src={pictureUrl}
              alt="App preview"
              className="w-full h-full object-cover"
            />
          ) : (
            // Placeholder — gradient that suggests a live stream
            <div className="w-full h-full bg-gradient-to-b from-[#1a1a2e] via-[#16213e] to-[#0f3460] flex flex-col items-center justify-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-white/40 text-[10px] font-outfit tracking-widest uppercase">
                Live
              </span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default IPhoneMockup;
