import { useState, useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface BanSuggestion {
  label: string;
  street: string;
  city: string;
  zipCode: string;
  state: string;
  country: "FR";
}

interface BanFeature {
  properties: {
    label: string;
    name: string;
    housenumber?: string;
    street?: string;
    postcode: string;
    city: string;
    context: string;
  };
}

interface Props {
  onSelect: (suggestion: BanSuggestion) => void;
  placeholder?: string;
  disabled?: boolean;
}

export default function AddressAutocomplete({
  onSelect,
  placeholder,
  disabled,
}: Props) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<BanSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (query.length < 3) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await fetch(
          `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(query)}&limit=5&autocomplete=1`,
        );
        const data = await res.json();
        const mapped: BanSuggestion[] = (data.features as BanFeature[]).map(
          (f) => {
            const p = f.properties;
            const contextParts = p.context.split(", ");
            return {
              label: p.label,
              street:
                p.housenumber && p.street
                  ? `${p.housenumber} ${p.street}`
                  : p.name,
              city: p.city,
              zipCode: p.postcode,
              state: contextParts[contextParts.length - 1],
              country: "FR",
            };
          },
        );
        setSuggestions(mapped);
        setIsOpen(true);
        setActiveIndex(-1);
      } catch {
        // silent failure — manual entry still works
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, []);

  const handleSelect = (suggestion: BanSuggestion) => {
    onSelect(suggestion);
    setQuery("");
    setIsOpen(false);
    setSuggestions([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (activeIndex >= 0 && suggestions[activeIndex]) {
        handleSelect(suggestions[activeIndex]);
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <div
        className={cn(
          "flex items-center gap-2",
          "border-2 border-[rgb(51,51,51)] rounded-[14px] px-3 py-3",
          "bg-transparent",
          disabled && "opacity-50",
        )}
      >
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => suggestions.length > 0 && setIsOpen(true)}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete="off"
          className={cn(
            "flex-1 bg-transparent outline-none",
            "text-sm text-foreground placeholder:text-muted-foreground font-outfit",
          )}
        />
        {isLoading && (
          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground shrink-0" />
        )}
      </div>

      {isOpen && (
        <ul className="absolute z-50 top-full mt-1 w-full bg-background border border-border rounded-2xl shadow-lg overflow-hidden">
          {suggestions.length === 0 ? (
            <li className="px-4 py-3 text-sm text-muted-foreground">
              Aucun résultat
            </li>
          ) : (
            suggestions.map((s, i) => (
              <li
                key={i}
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSelect(s);
                }}
                className={cn(
                  "px-4 py-3 text-sm cursor-pointer transition-colors font-outfit",
                  i === activeIndex
                    ? "bg-primary/10 text-primary"
                    : "hover:bg-muted/50 text-foreground",
                  i < suggestions.length - 1 && "border-b border-border",
                )}
              >
                {s.label}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
