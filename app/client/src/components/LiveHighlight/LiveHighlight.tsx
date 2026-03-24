import { useEffect, useState } from "react";
import { Bell, Share2 } from "lucide-react";
import ButtonV2 from "@/components/ui/ButtonV2/ButtonV2";
import { Skeleton } from "@/components/ui/skeleton";

interface LiveHighlightData {
  id: number;
  name: string;
  description: string | null;
  startsAt: string;
  endsAt: string | null;
  coverUrl: string | null;
  host: {
    nickname: string;
    avatarUrl: string | null;
  };
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function computeTimeLeft(startsAt: string): TimeLeft {
  const diff = Math.max(0, new Date(startsAt).getTime() - Date.now());
  const totalSeconds = Math.floor(diff / 1000);
  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
  };
}

function pad(n: number): string {
  return n.toString().padStart(2, "0");
}

function generateIcs(live: LiveHighlightData): string {
  const start = new Date(live.startsAt);
  const end = live.endsAt
    ? new Date(live.endsAt)
    : new Date(start.getTime() + 60 * 60 * 1000);

  const fmt = (d: Date) =>
    d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//WhyNot//Live//FR",
    "BEGIN:VEVENT",
    `UID:live-${live.id}@whynot`,
    `DTSTAMP:${fmt(new Date())}`,
    `DTSTART:${fmt(start)}`,
    `DTEND:${fmt(end)}`,
    `SUMMARY:${live.name}`,
    live.description
      ? `DESCRIPTION:${live.description.replace(/\n/g, "\\n")}`
      : "",
    `URL:${window.location.origin}/live/${live.id}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ]
    .filter(Boolean)
    .join("\r\n");
}

interface LiveHighlightProps {
  live: LiveHighlightData | null | undefined;
  isLoading: boolean;
}

export function LiveHighlight({ live, isLoading }: LiveHighlightProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null);

  useEffect(() => {
    if (!live) return;
    setTimeLeft(computeTimeLeft(live.startsAt));
    const interval = setInterval(() => {
      setTimeLeft(computeTimeLeft(live.startsAt));
    }, 1000);
    return () => clearInterval(interval);
  }, [live]);

  if (isLoading) {
    return <Skeleton className="w-full h-[360px] rounded-2xl" />;
  }

  if (!live) {
    return (
      <div className="w-full rounded-2xl border border-dashed border-border flex items-center justify-center py-10 text-sm text-muted-foreground font-outfit">
        Aucun live annoncé pour le moment.
      </div>
    );
  }

  const handleShare = async () => {
    const url = `${window.location.origin}/live/${live.id}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: live.name,
          text: live.description ?? live.name,
          url,
        });
      } catch {
        // user cancelled — no action needed
      }
    } else {
      await navigator.clipboard.writeText(url);
    }
  };

  const handleReminder = () => {
    const ics = generateIcs(live);
    const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `live-${live.id}.ics`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  return (
    <div className="relative w-full rounded-2xl overflow-hidden min-h-[360px] flex flex-col justify-between">
      {/* Background: cover image, then host avatar, then gradient fallback */}
      {live.coverUrl || live.host.avatarUrl ? (
        <img
          src={live.coverUrl ?? live.host.avatarUrl!}
          alt={live.name}
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-violet-600 to-fuchsia-600" />
      )}

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/80" />

      {/* Content */}
      <div className="relative z-10 flex flex-col h-full p-5 gap-4">
        {/* Top row */}
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-outfit font-black tracking-widest uppercase text-white/80">
            Premier live popup
          </span>
          <span className="text-xs font-outfit font-bold bg-fuchsia-500 text-white px-3 py-1 rounded-full flex items-center gap-1">
            <span className="size-1.5 rounded-full bg-white inline-block" />
            Bientôt
          </span>
        </div>

        {/* Host info */}
        <div className="flex items-center gap-3">
          {live.host.avatarUrl ? (
            <img
              src={live.host.avatarUrl}
              alt={live.host.nickname}
              className="size-14 rounded-full object-cover border-2 border-white/60 shrink-0"
            />
          ) : (
            <div className="size-14 rounded-full bg-white/20 border-2 border-white/60 flex items-center justify-center text-white font-outfit font-black text-xl uppercase shrink-0">
              {live.host.nickname[0]}
            </div>
          )}
          <div>
            <p className="font-syne font-bold text-white text-base leading-tight">
              {live.host.nickname}
            </p>
          </div>
        </div>

        {/* Live title & description */}
        <div className="flex-1">
          <h2 className="font-syne font-extrabold text-white text-2xl leading-tight">
            {live.name}
          </h2>
          {live.description && (
            <p className="text-white/70 font-outfit text-sm mt-1 line-clamp-2">
              {live.description}
            </p>
          )}
        </div>

        {/* Countdown */}
        {timeLeft && (
          <div className="flex gap-2">
            {[
              { value: timeLeft.days, label: "Jours" },
              { value: timeLeft.hours, label: "Heures" },
              { value: timeLeft.minutes, label: "Min" },
              { value: timeLeft.seconds, label: "Sec" },
            ].map(({ value, label }) => (
              <div
                key={label}
                className="flex-1 bg-black/50 rounded-xl py-3 flex flex-col items-center gap-0.5"
              >
                <span className="font-syne font-extrabold text-white text-2xl leading-none">
                  {pad(value)}
                </span>
                <span className="text-[9px] font-outfit font-semibold text-white/60 uppercase tracking-wider">
                  {label}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-3">
          <ButtonV2
            label="Me rappeler"
            icon={<Bell className="size-4" />}
            className="flex-1 bg-primary text-primary-foreground rounded-full font-outfit font-bold text-sm"
            onClick={handleReminder}
          />
          <ButtonV2
            label="Partager"
            icon={<Share2 className="size-4" />}
            className="rounded-full border border-white text-white bg-transparent font-outfit font-bold text-sm px-6"
            onClick={handleShare}
          />
        </div>
      </div>
    </div>
  );
}
