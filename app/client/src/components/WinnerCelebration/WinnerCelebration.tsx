import { useEffect } from "react";
import { Trophy } from "lucide-react";

const PARTICLE_DIRS = [
  { tx: "0px",    ty: "-80px"  },
  { tx: "31px",   ty: "-74px"  },
  { tx: "57px",   ty: "-57px"  },
  { tx: "74px",   ty: "-31px"  },
  { tx: "80px",   ty: "0px"    },
  { tx: "74px",   ty: "31px"   },
  { tx: "57px",   ty: "57px"   },
  { tx: "31px",   ty: "74px"   },
  { tx: "0px",    ty: "80px"   },
  { tx: "-31px",  ty: "74px"   },
  { tx: "-57px",  ty: "57px"   },
  { tx: "-74px",  ty: "31px"   },
  { tx: "-80px",  ty: "0px"    },
  { tx: "-74px",  ty: "-31px"  },
  { tx: "-57px",  ty: "-57px"  },
  { tx: "-31px",  ty: "-74px"  },
] as const;

interface WinnerCelebrationProps {
  onDismiss: () => void;
}

export function WinnerCelebration({ onDismiss }: WinnerCelebrationProps) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 1200);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div className="fixed inset-0 z-[200] pointer-events-none flex items-center justify-center">
      <div className="relative flex items-center justify-center">
        <Trophy
          className="text-primary w-12 h-12"
          style={{ animation: "bullet-pop 0.4s ease-out" }}
        />
        {PARTICLE_DIRS.map((dir, i) => (
          <span
            key={i}
            className="absolute w-3 h-3 rounded-full bg-primary pointer-events-none"
            style={{
              "--tx": dir.tx,
              "--ty": dir.ty,
              animation: "particle-burst 0.9s ease-out forwards",
            } as React.CSSProperties}
          />
        ))}
      </div>
    </div>
  );
}
