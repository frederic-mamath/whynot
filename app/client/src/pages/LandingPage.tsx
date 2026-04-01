import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import posthog from "posthog-js";
import {
  TrendingDown,
  Zap,
  Users,
  ChevronDown,
  CheckCircle,
  Radio,
  Gavel,
  Eye,
  Trophy,
} from "lucide-react";
import { Accordion } from "radix-ui";
import { cn } from "../lib/utils";
import { trpc } from "../lib/trpc";
import ButtonV2 from "../components/ui/ButtonV2/ButtonV2";
import IPhoneMockup from "../components/ui/IPhoneMockup/IPhoneMockup";
import coinImg from "../assets/images/optimized-mario-galaxy-coin.png";

// ─── Floating badge components (landing-page-specific) ───────────────────────

function FloatingBadge({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "bg-card/90 backdrop-blur-sm border border-border rounded-2xl",
        "px-3 py-2 flex items-center gap-2",
        "text-xs font-outfit whitespace-nowrap shadow-lg",
        className,
      )}
    >
      {children}
    </div>
  );
}

function LiveBadge() {
  return (
    <FloatingBadge>
      <Radio className="w-3 h-3 text-red-500 animate-pulse" />
      <span className="text-foreground font-semibold">EN DIRECT</span>
    </FloatingBadge>
  );
}

function BidBadge() {
  return (
    <FloatingBadge>
      <Gavel className="w-3 h-3 text-primary" />
      <span className="text-foreground">Nouvelle enchère</span>
      <span className="text-primary font-bold">+€12</span>
    </FloatingBadge>
  );
}

function ViewerBadge() {
  return (
    <FloatingBadge>
      <Eye className="w-3 h-3 text-muted" />
      <span className="text-foreground font-semibold">127</span>
      <span className="text-muted">spectateurs</span>
    </FloatingBadge>
  );
}

function WinnerBadge() {
  return (
    <FloatingBadge>
      <Trophy className="w-3 h-3 text-primary" />
      <span className="text-foreground">Vendu ·</span>
      <span className="text-primary font-bold">€89</span>
    </FloatingBadge>
  );
}

function CoinBadge() {
  return (
    <img
      src={coinImg}
      alt="Pièce collector"
      loading="lazy"
      decoding="async"
      className="w-30 h-30 object-contain drop-shadow-lg"
    />
  );
}

// ─── Section tracking hook ────────────────────────────────────────────────────

function useSectionTracking(sectionName: string) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          posthog.capture("section_viewed", { section_name: sectionName });
          observer.disconnect();
        }
      },
      { threshold: 0.3 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [sectionName]);
  return ref;
}

// ─── Waitlist form ────────────────────────────────────────────────────────────

function WaitlistForm({
  role,
  placeholder,
  buttonLabel,
  successMessage,
}: {
  role: "buyer" | "seller";
  placeholder: string;
  buttonLabel: string;
  successMessage: string;
}) {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const join = trpc.waitlist.join.useMutation({
    onSuccess: () => {
      posthog.capture("waitlist_signup", { role, email });
      setSubmitted(true);
      setError(null);
    },
    onError: (err) => {
      if (err.data?.code === "CONFLICT") {
        setError("Vous êtes déjà inscrit — on vous contacte au lancement !");
      } else {
        setError("Une erreur est survenue. Réessayez dans un instant.");
      }
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    posthog.capture("cta_click", {
      section: role === "buyer" ? "hero" : "seller",
      label: buttonLabel,
    });
    join.mutate({ email: email.trim(), role });
  };

  if (submitted) {
    return (
      <div className="flex items-center gap-2 text-primary font-outfit font-medium">
        <CheckCircle className="w-5 h-5 shrink-0" />
        <span>{successMessage}</span>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md">
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={placeholder}
          required
          className={cn(
            "flex-1 bg-card border border-border rounded-[28px] px-5 py-3",
            "text-foreground placeholder:text-muted text-base outline-none",
            "focus:border-primary transition-colors",
          )}
        />
        <ButtonV2
          type="submit"
          label={join.isPending ? "..." : buttonLabel}
          disabled={join.isPending}
          className="bg-primary text-primary-foreground font-outfit font-semibold px-6 shrink-0"
        />
      </form>
      {error && <p className="text-sm text-muted mt-2 px-1">{error}</p>}
    </div>
  );
}

// ─── FAQ data ─────────────────────────────────────────────────────────────────

const FAQ_ITEMS = [
  {
    q: "Combien coûte la vente sur Popup ?",
    a: "Les commissions commencent à partir de 5%, sans abonnement ni frais d'inscription. Vous ne payez que lorsque vous vendez.",
  },
  {
    q: "Comment sont sécurisés les paiements ?",
    a: "Tous les paiements transitent par Stripe, le leader mondial du paiement en ligne. Vos données bancaires ne sont jamais stockées sur nos serveurs.",
  },
  {
    q: "Comment fonctionne la livraison ?",
    a: "Le vendeur prend en charge l'expédition après la vente. L'acheteur peut suivre sa commande directement depuis l'application Popup.",
  },
  {
    q: "Qui peut vendre sur Popup ?",
    a: "Tout le monde ! Que vous soyez particulier ou professionnel, Popup est ouvert à tous les vendeurs indépendants qui veulent vendre en live.",
  },
];

// ─── Main page ────────────────────────────────────────────────────────────────

export default function LandingPage() {
  const heroRef = useSectionTracking("hero");
  const sellerRef = useSectionTracking("seller");
  const howItWorksRef = useSectionTracking("how_it_works");
  const faqRef = useSectionTracking("faq");

  return (
    <div className="min-h-screen bg-background text-foreground w-full">
      {/* ── Navbar ── */}
      <nav className="flex items-center justify-between px-6 py-5 max-w-5xl mx-auto w-full">
        <span className="font-outfit font-bold text-xl text-primary tracking-tight">
          popup
        </span>
        <Link
          to="/login"
          onClick={() =>
            posthog.capture("cta_click", {
              section: "navbar",
              label: "Se connecter",
            })
          }
          className="text-sm text-muted hover:text-foreground transition-colors font-outfit"
        >
          Se connecter
        </Link>
      </nav>

      {/* ── Hero ── */}
      <section
        ref={heroRef as React.RefObject<HTMLElement>}
        className="px-6 pt-10 pb-16 max-w-5xl mx-auto w-full"
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:gap-16">
          {/* Copy */}
          <div className="flex-1 mb-10 lg:mb-0">
            <h1 className="font-outfit font-bold text-3xl sm:text-4xl lg:text-5xl leading-tight mb-4">
              L'application d'enchères en direct pour la{" "}
              <span className="text-primary">mode</span> et les{" "}
              <span className="text-primary">objets de collection</span>
            </h1>
            <p className="text-muted text-base sm:text-lg mb-8 max-w-lg">
              Rejoignez les lives, placez vos enchères en temps réel et achetez
              des pièces rares instantanément.
            </p>
            <WaitlistForm
              role="buyer"
              placeholder="Votre email"
              buttonLabel="Rejoindre la liste d'attente"
              successMessage="C'est noté — on vous prévient dès le lancement !"
            />
          </div>

          {/* App preview — animated iPhone mockup */}
          <div className="flex-shrink-0 flex justify-center">
            <IPhoneMockup
              floatingElements={[
                <LiveBadge />,
                <BidBadge />,
                <CoinBadge />,
                <ViewerBadge />,
                <WinnerBadge />,
              ]}
            />
          </div>
        </div>
      </section>

      {/* ── Divider ── */}
      <div className="border-t border-border max-w-5xl mx-auto" />

      {/* ── Seller section ── */}
      <section
        ref={sellerRef as React.RefObject<HTMLElement>}
        className="px-6 py-16 max-w-5xl mx-auto w-full"
      >
        <div className="text-center mb-10">
          <h2 className="font-outfit font-bold text-2xl sm:text-3xl lg:text-4xl mb-4">
            Vendez sur Popup, la marketplace du{" "}
            <span className="text-primary">shopping en live</span> pour les
            vendeurs indépendants
          </h2>
          <p className="text-muted text-base sm:text-lg max-w-2xl mx-auto">
            Tout ce dont vous avez besoin pour transformer votre passion en
            profit avec le shopping en live.
          </p>
        </div>

        {/* Feature cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12">
          {[
            {
              icon: <TrendingDown className="w-5 h-5" />,
              title: "Commissions faibles, marge élevée",
              desc: "Les commissions commencent à partir de 5% sans débourser un sou en avance.",
            },
            {
              icon: <Zap className="w-5 h-5" />,
              title: "Vendez plus vite avec les enchères en live",
              desc: "Créez de l'urgence, animez votre communauté et vendez en quelques minutes.",
            },
            {
              icon: <Users className="w-5 h-5" />,
              title: "Construit pour les vendeurs indépendants",
              desc: "Que ça soit un loisir ou un business à temps plein, Popup est conçu pour les vendeurs comme vous.",
            },
          ].map(({ icon, title, desc }) => (
            <div
              key={title}
              className="bg-card border border-border rounded-2xl p-5 flex flex-col gap-3"
            >
              <span className="text-primary">{icon}</span>
              <p className="font-outfit font-semibold text-sm text-foreground">
                {title}
              </p>
              <p className="text-muted text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>

        {/* Seller waitlist */}
        <div className="flex flex-col items-center gap-3">
          <p className="text-sm text-muted font-outfit">
            Rejoignez la liste d'attente vendeur
          </p>
          <WaitlistForm
            role="seller"
            placeholder="Votre email professionnel"
            buttonLabel="Je veux vendre sur Popup"
            successMessage="Super ! On vous contacte en priorité au lancement vendeur."
          />
        </div>
      </section>

      {/* ── Divider ── */}
      <div className="border-t border-border max-w-5xl mx-auto" />

      {/* ── How it works ── */}
      <section
        ref={howItWorksRef as React.RefObject<HTMLElement>}
        className="px-6 py-16 max-w-5xl mx-auto w-full"
      >
        <h2 className="font-outfit font-bold text-2xl sm:text-3xl text-center mb-12">
          Comment ça marche ?
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            {
              step: "01",
              title: "Rejoignez un live",
              desc: "Regardez les vendeurs présenter leurs produits en temps réel.",
            },
            {
              step: "02",
              title: "Placez vos enchères",
              desc: "Enchérissez sur les pièces qui vous intéressent avant la fin du compte à rebours.",
            },
            {
              step: "03",
              title: "Gagnez et payez",
              desc: "Le plus offrant reçoit un lien de paiement Stripe sécurisé.",
            },
            {
              step: "04",
              title: "Recevez votre commande",
              desc: "Suivez votre livraison depuis l'application.",
            },
          ].map(({ step, title, desc }) => (
            <div key={step} className="flex flex-col gap-3">
              <span className="font-outfit font-bold text-5xl text-primary leading-none">
                {step}
              </span>
              <p className="font-outfit font-semibold text-foreground">
                {title}
              </p>
              <p className="text-muted text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Divider ── */}
      <div className="border-t border-border max-w-5xl mx-auto" />

      {/* ── FAQ ── */}
      <section
        ref={faqRef as React.RefObject<HTMLElement>}
        className="px-6 py-16 max-w-2xl mx-auto w-full"
      >
        <h2 className="font-outfit font-bold text-2xl sm:text-3xl text-center mb-10">
          Questions fréquentes
        </h2>
        <Accordion.Root
          type="single"
          collapsible
          className="flex flex-col gap-2"
        >
          {FAQ_ITEMS.map(({ q, a }) => (
            <Accordion.Item
              key={q}
              value={q}
              className="border border-border rounded-2xl overflow-hidden"
            >
              <Accordion.Trigger
                onClick={() =>
                  posthog.capture("accordion_opened", { question: q })
                }
                className={cn(
                  "w-full flex items-center justify-between gap-4",
                  "px-5 py-4 text-left font-outfit font-medium text-sm text-foreground",
                  "hover:text-primary transition-colors group cursor-pointer",
                )}
              >
                <span>{q}</span>
                <ChevronDown className="w-4 h-4 shrink-0 text-muted transition-transform duration-200 group-data-[state=open]:rotate-180" />
              </Accordion.Trigger>
              <Accordion.Content className="overflow-hidden data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0">
                <p className="text-muted text-sm leading-relaxed px-5 pb-4">
                  {a}
                </p>
              </Accordion.Content>
            </Accordion.Item>
          ))}
        </Accordion.Root>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-border px-6 py-10">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="font-outfit font-bold text-lg text-primary">
            popup
          </span>
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted">
            <Link to="/cgu" className="hover:text-foreground transition-colors">
              CGU
            </Link>
            <Link
              to="/politique-de-confidentialite"
              className="hover:text-foreground transition-colors"
            >
              Politique de confidentialité
            </Link>
            <a
              href="mailto:hello@popup-live.fr"
              className="hover:text-foreground transition-colors"
            >
              Contact
            </a>
          </div>
          <span className="text-xs text-muted">© 2025 Popup</span>
        </div>
      </footer>
    </div>
  );
}
