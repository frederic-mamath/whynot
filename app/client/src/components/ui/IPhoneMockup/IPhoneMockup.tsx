/**
 * IPhoneMockup — design-system component
 *
 * Renders an iPhone 15/16-style frame with:
 *  - `pictureUrl`       → fills the screen area (object-cover)
 *  - `floatingElements` → array of React nodes that orbit around the phone
 *
 * Animation architecture (hybrid):
 *  - Orbital motion    → Framer Motion useAnimationFrame (ellipse math via cos/sin,
 *                         only updates transform — no layout reflow)
 *  - 3D tilt on hover  → Framer Motion useSpring (spring physics, fires only on mousemove)
 *
 * Known trade-offs / downsides:
 *  1. prefers-reduced-motion — orbit is paused; tilt disabled. Required for WCAG 2.1.
 *  2. Distraction — keep floatingElements count ≤ 6 and orbit slow (10–14s per loop).
 *  3. transformStyle: preserve-3d creates a new stacking context. Floating elements
 *     must live inside the 3D scene to tilt with the phone.
 *  4. Mouse tilt is desktop-only (onMouseMove doesn't fire on touch screens).
 *  5. useAnimationFrame fires per frame for each orbital element. For ≤ 6 elements
 *     this is negligible; avoid using this component with many more elements.
 */

import { useRef } from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  useReducedMotion,
  useAnimationFrame,
} from "motion/react";
import { cn } from "@/lib/utils";

// ─── Orbital element ──────────────────────────────────────────────────────────
// Ellipse radii in px from the phone center.
// radiusX < radiusY because the phone is taller than wide.
const ORBIT_RADIUS_X = 155;
const ORBIT_RADIUS_Y = 265;

// Duration per full orbit (ms). Varied per slot for an organic feel.
const ORBIT_DURATIONS_MS = [10000, 13000, 11000, 14000, 10500, 12500];

// Pop animation timing.
// Each element: pops in → stays visible → pops out → waits → repeats.
const POP_VISIBLE_S = 4;  // how long the element stays visible
const POP_HIDDEN_S = 2.5; // gap between cycles (repeatDelay)

interface OrbitalElementProps {
  children: React.ReactNode;
  initialAngle: number; // radians — starting position on the ellipse
  durationMs: number;
  popDelay: number;     // seconds — stagger offset so elements don't all pop together
}

function OrbitalElement({ children, initialAngle, durationMs, popDelay }: OrbitalElementProps) {
  const shouldReduceMotion = useReducedMotion();

  // Start at the correct ellipse position so there's no jump on first frame.
  const x = useMotionValue(Math.cos(initialAngle) * ORBIT_RADIUS_X);
  const y = useMotionValue(Math.sin(initialAngle) * ORBIT_RADIUS_Y);

  useAnimationFrame((time) => {
    if (shouldReduceMotion) return;
    // Advance the angle based on elapsed time, keeping the initial offset.
    const angle = initialAngle + (time / durationMs) * Math.PI * 2;
    x.set(Math.cos(angle) * ORBIT_RADIUS_X);
    y.set(Math.sin(angle) * ORBIT_RADIUS_Y);
  });

  return (
    // Anchor at the container center; x/y move it along the ellipse.
    <motion.div
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        x,
        y,
        // Center the badge on the ellipse point (not top-left-anchored).
        translateX: "-50%",
        translateY: "-50%",
        pointerEvents: "none",
        zIndex: 20,
      }}
    >
      {/* Pop-in / pop-out wrapper — scale + opacity keyframes */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={
          shouldReduceMotion
            ? { scale: 1, opacity: 1 }
            : {
                // Keyframe sequence:
                //  0%→8%   : scale 0 → 1.2  (fast pop-in overshoot)
                //  8%→14%  : scale 1.2 → 0.9 (elastic rebound)
                //  14%→20% : scale 0.9 → 1   (settle)
                //  20%→80% : hold at 1        (visible)
                //  80%→100%: scale 1 → 0      (pop-out, fade)
                scale:   [0, 1.2, 0.9, 1, 1, 0],
                opacity: [0, 1,   1,   1, 1, 0],
              }
        }
        transition={
          shouldReduceMotion
            ? { duration: 0 }
            : {
                duration: POP_VISIBLE_S,
                times: [0, 0.08, 0.14, 0.20, 0.80, 1],
                ease: ["easeOut", "easeOut", "easeOut", "linear", "easeIn"],
                repeat: Infinity,
                repeatDelay: POP_HIDDEN_S,
                delay: popDelay,
              }
        }
      >
        {children}
      </motion.div>
    </motion.div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface IPhoneMockupProps {
  pictureUrl?: string;
  floatingElements?: React.ReactNode[];
  className?: string;
}

export function IPhoneMockup({
  pictureUrl,
  floatingElements = [],
  className,
}: IPhoneMockupProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();

  // 3D tilt driven by mouse position — spring for natural settle.
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
    rotateY.set(dx * 14); // ±14° horizontal
    rotateX.set(-dy * 8); // ±8° vertical (asymmetric feels more natural)
  };

  const handleMouseLeave = () => {
    rotateX.set(0);
    rotateY.set(0);
  };

  return (
    // Outer wrapper: 3D tilt scene. overflow-visible lets orbiting elements
    // extend beyond the explicit bounding box when needed.
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
        "relative flex items-center justify-center overflow-visible",
        // Container sized to hold the ellipse (2× radii + phone size).
        "w-[380px] h-[600px]",
        className,
      )}
    >
      {/* ── Orbiting elements ── */}
      {floatingElements.map((el, i) => (
        <OrbitalElement
          key={i}
          // Distribute elements evenly around the ellipse.
          initialAngle={(i / floatingElements.length) * Math.PI * 2}
          durationMs={ORBIT_DURATIONS_MS[i % ORBIT_DURATIONS_MS.length]}
          // Stagger pop-ins so elements never appear/disappear simultaneously.
          // Spread across one full pop cycle (visible + hidden duration).
          popDelay={(i * (POP_VISIBLE_S + POP_HIDDEN_S)) / floatingElements.length}
        >
          {el}
        </OrbitalElement>
      ))}

      {/* ── iPhone frame ── */}
      <div
        className={cn(
          "relative z-10",
          "w-[200px] h-[420px] sm:w-[240px] sm:h-[500px]",
          "rounded-[48px] sm:rounded-[52px]",
          "bg-[#1c1c1e]",
          // Metallic edge: subtle highlight + deep drop shadow.
          "ring-1 ring-white/[0.12]",
          "shadow-[0_0_0_2px_#0a0a0a,0_32px_64px_-12px_rgba(0,0,0,0.8)]",
        )}
      >
        {/* Volume buttons (left) */}
        <div className="absolute -left-[3px] top-[88px] w-[3px] h-7 bg-[#2c2c2e] rounded-l-sm" />
        <div className="absolute -left-[3px] top-[124px] w-[3px] h-10 bg-[#2c2c2e] rounded-l-sm" />
        <div className="absolute -left-[3px] top-[172px] w-[3px] h-10 bg-[#2c2c2e] rounded-l-sm" />
        {/* Power button (right) */}
        <div className="absolute -right-[3px] top-[120px] w-[3px] h-16 bg-[#2c2c2e] rounded-r-sm" />

        {/* Screen */}
        <div className="absolute inset-[3px] rounded-[45px] sm:rounded-[49px] overflow-hidden bg-[#0a0a0a]">
          {/* Dynamic Island */}
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20">
            <div className="w-[88px] h-[28px] bg-black rounded-full" />
          </div>

          {/* Content */}
          {pictureUrl ? (
            <img
              src={pictureUrl}
              alt="Aperçu de l'app"
              className="w-full h-full object-cover"
            />
          ) : (
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
