import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { ArrowLeft, Building2, Check, User } from "lucide-react";
import ButtonV2 from "@/components/ui/ButtonV2";
import Input from "@/components/ui/Input/Input";
import { useSellerOnboarding } from "./SellerOnboardingPage.hooks";

const STEPS = [
  { displayId: 0, label: "Accepter les règles de la plateforme" },
  { displayId: 2, label: "Catégorie principale" },
  { displayId: 3, label: "Sous-catégorie" },
  { displayId: 4, label: "Type de vendeur" },
  { displayId: 5, label: "Canaux de vente actuels" },
  { displayId: 6, label: "Chiffre d'affaires mensuel" },
  { displayId: 7, label: "Nombre d'articles à vendre" },
  { displayId: 8, label: "Taille de l'équipe" },
  { displayId: 9, label: "Disponibilité pour les lives" },
  { displayId: 10, label: "Adresse de retour" },
  { displayId: 11, label: "Confirmation de la demande" },
];

const SELLER_RULES = [
  "Proposer uniquement des articles dont vous êtes propriétaire ou autorisé à vendre.",
  "Décrire honnêtement l'état et les caractéristiques de chaque article.",
  "Expédier les commandes dans les délais annoncés.",
  "Respecter les acheteurs et maintenir un niveau de service professionnel.",
  "Ne pas vendre d'articles contrefaits, illégaux ou interdits par la loi.",
  "Accepter les retours conformément à la politique de la plateforme.",
  "Toute violation peut entraîner la suspension ou la suppression de votre compte vendeur.",
];

const CATEGORIES = [
  { value: "Trading card games", emoji: "🃏" },
  { value: "Comics", emoji: "📚" },
  { value: "Sneakers & shoes", emoji: "👟" },
  { value: "Video games", emoji: "🎮" },
];

const SUB_CATEGORIES: Record<string, string[]> = {
  "Trading card games": [
    "Singles",
    "Produits scellés",
    "Cartes gradées",
    "Accessoires",
  ],
  Comics: [
    "BD franco-belge",
    "Comics américains",
    "Manga",
    "Éditions collector",
  ],
  "Sneakers & shoes": ["Sneakers", "Boots", "Sandales", "Accessoires"],
  "Video games": [
    "Jeux rétro",
    "Jeux modernes",
    "Consoles & accessoires",
    "Guides, manuels & boîtiers",
  ],
};

const SELLING_CHANNELS = [
  "Site web",
  "Mon magasin ou entrepôt",
  "Autres plateformes (Shopify, Etsy, Amazon…)",
  "Réseaux sociaux",
  "Nulle part, je démarre",
];

const REVENUE_RANGES = [
  "Moins de 1 000 €",
  "1 000 € – 5 000 €",
  "20 000 € – 50 000 €",
  "50 000 € – 100 000 €",
  "100 000 € – 1 000 000 €",
  "Plus d'1 000 000 €",
];

const ITEM_COUNT_RANGES = [
  "Moins de 10 articles",
  "10 – 100 articles",
  "101 – 250 articles",
  "Plus de 251 articles",
];

const TEAM_SIZE_RANGES = [
  "Juste moi",
  "2 – 3 personnes",
  "4 – 10 personnes",
  "11 – 50 personnes",
  "50+ personnes",
];

const LIVE_HOURS_RANGES = [
  "1 – 2 heures",
  "3 – 10 heures",
  "11 – 20 heures",
  "Plus de 20 heures",
];

const PARTICLE_DIRS = [
  { tx: "0px",   ty: "-16px" },
  { tx: "11px",  ty: "-11px" },
  { tx: "16px",  ty: "0px"   },
  { tx: "11px",  ty: "11px"  },
  { tx: "0px",   ty: "16px"  },
  { tx: "-11px", ty: "11px"  },
  { tx: "-16px", ty: "0px"   },
  { tx: "-11px", ty: "-11px" },
] as const;

function OptionList({
  options,
  onSelect,
  disabled,
}: {
  options: string[];
  onSelect: (v: string) => void;
  disabled: boolean;
}) {
  return (
    <div className="flex flex-col gap-2 mt-2">
      {options.map((opt) => (
        <button
          key={opt}
          disabled={disabled}
          onClick={() => onSelect(opt)}
          className={cn(
            "text-left px-4 py-3 rounded-xl border border-border bg-card",
            "text-sm font-medium text-foreground",
            "hover:border-primary hover:bg-primary/5 transition-colors",
            "disabled:opacity-50",
          )}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

export default function SellerOnboardingPage() {
  const navigate = useNavigate();
  const {
    currentStepIndex,
    viewingStep,
    surveyData,
    sellerStatus,
    justCompletedStepIndex,
    clearCompletedAnimation,
    navigateToStep,
    goBack,
    handleAcceptRules,
    handleSaveCategory,
    handleSaveSubCategory,
    handleSaveSellerType,
    handleSaveSellingChannels,
    handleSaveMonthlyRevenue,
    handleSaveItemCount,
    handleSaveTeamSize,
    handleSaveLiveHours,
    handleSaveReturnAddress,
    handleSubmitApplication,
    isLoading,
    isPending,
  } = useSellerOnboarding();

  const [selectedChannels, setSelectedChannels] = useState<string[]>([]);
  const [address, setAddress] = useState({
    street: "",
    city: "",
    zipCode: "",
    country: "",
  });

  const toggleChannel = (channel: string) => {
    setSelectedChannels((prev) =>
      prev.includes(channel)
        ? prev.filter((c) => c !== channel)
        : [...prev, channel],
    );
  };

  const isAddressComplete =
    address.street.trim() &&
    address.city.trim() &&
    address.zipCode.trim() &&
    address.country.trim();

  if (isLoading) return null;

  const progressPct = (currentStepIndex / STEPS.length) * 100;

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground py-10 gap-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground font-outfit">
            Étape {Math.min(viewingStep + 1, STEPS.length)} / {STEPS.length}
          </p>
          {viewingStep > 0 && (
            <button
              onClick={goBack}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground hover:underline transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Retour
            </button>
          )}
        </div>
        <h1 className="text-2xl font-syne font-extrabold">Deviens vendeur</h1>
      </div>

      {/* Progress bar with bullets */}
      <div className="relative w-full h-5 flex items-center">
        <div className="absolute w-full h-1.5 bg-muted rounded-full">
          <div
            className="h-full bg-primary rounded-full transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        {STEPS.map((step, index) => {
          const isActive = index === viewingStep;
          const isCompleted = index < currentStepIndex && !isActive;
          const isLocked = index > currentStepIndex;
          return (
            <div
              key={step.displayId}
              className="absolute -translate-x-1/2"
              style={{ left: `${(index / (STEPS.length - 1)) * 100}%` }}
            >
              <div className="group relative flex items-center justify-center">
                <button
                  onClick={() => !isLocked && navigateToStep(index)}
                  disabled={isLocked}
                  style={
                    justCompletedStepIndex === index
                      ? { animation: "bullet-pop 0.4s ease-out" }
                      : undefined
                  }
                  className={cn(
                    "rounded-full transition-all duration-200",
                    isCompleted && "w-3 h-3 bg-primary",
                    isActive && "w-4 h-4 border-2 border-foreground bg-background",
                    isLocked && "w-2.5 h-2.5 bg-muted cursor-default",
                  )}
                />
                {justCompletedStepIndex === index &&
                  PARTICLE_DIRS.map((dir, i) => (
                    <span
                      key={i}
                      onAnimationEnd={
                        i === PARTICLE_DIRS.length - 1
                          ? clearCompletedAnimation
                          : undefined
                      }
                      className="absolute w-1.5 h-1.5 rounded-full bg-primary pointer-events-none"
                      style={
                        {
                          "--tx": dir.tx,
                          "--ty": dir.ty,
                          animation: "particle-burst 0.6s ease-out forwards",
                        } as React.CSSProperties
                      }
                    />
                  ))}
                <span
                  className={cn(
                    "absolute bottom-full mb-2 left-1/2 -translate-x-1/2",
                    "hidden group-hover:block",
                    "bg-foreground text-background text-xs font-outfit",
                    "px-2 py-1 rounded-md whitespace-nowrap pointer-events-none z-10",
                  )}
                >
                  {step.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Active step card */}
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-foreground bg-card text-foreground">
        <div className="shrink-0 w-7 h-7 rounded-full bg-foreground text-background flex items-center justify-center text-xs font-bold">
          <span>{viewingStep + 1}</span>
        </div>
        <span className="text-sm font-medium">{STEPS[viewingStep].label}</span>
      </div>

      {/* ── Step forms ── */}

      {/* Step 0 — Accept rules */}
      {viewingStep === 0 && (
        <div className="flex flex-col gap-4 mt-2">
          <div className="flex flex-col gap-2 p-4 rounded-xl bg-card border border-border">
            <p className="text-sm font-bold text-foreground mb-1">
              Règles de la plateforme
            </p>
            <ul className="flex flex-col gap-2">
              {SELLER_RULES.map((rule, i) => (
                <li
                  key={i}
                  className="flex gap-2 text-sm text-muted-foreground"
                >
                  <span className="shrink-0 text-primary font-bold mt-0.5">
                    {i + 1}.
                  </span>
                  <span>{rule}</span>
                </li>
              ))}
            </ul>
          </div>
          <ButtonV2
            className="w-full bg-primary text-primary-foreground"
            label="J'accepte les règles"
            disabled={isPending}
            onClick={handleAcceptRules}
          />
        </div>
      )}

      {/* Step 1 — Main category */}
      {viewingStep === 1 && (
        <div className="flex flex-col gap-2 mt-2">
          <p className="text-sm text-muted-foreground">
            Dans quelle catégorie vendrez-vous le plus souvent ?
          </p>
          <div className="grid grid-cols-2 gap-3 mt-1">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                disabled={isPending}
                onClick={() => handleSaveCategory(cat.value)}
                className={cn(
                  "flex flex-col items-center justify-center gap-2 p-4 rounded-xl",
                  "border border-border bg-card text-foreground",
                  "hover:border-primary hover:bg-primary/5 transition-colors",
                  "text-sm font-medium disabled:opacity-50",
                )}
              >
                <span className="text-3xl">{cat.emoji}</span>
                <span className="text-center leading-tight">{cat.value}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 2 — Sub-category */}
      {viewingStep === 2 && (
        <div className="flex flex-col gap-2 mt-2">
          <p className="text-sm text-muted-foreground">
            Quelle est votre sous-catégorie principale ?
          </p>
          <OptionList
            options={SUB_CATEGORIES[surveyData?.category ?? ""] ?? []}
            onSelect={handleSaveSubCategory}
            disabled={isPending}
          />
        </div>
      )}

      {/* Step 3 — Seller type */}
      {viewingStep === 3 && (
        <div className="flex flex-col gap-3 mt-2">
          <p className="text-sm text-muted-foreground">
            Qu'est-ce qui vous décrit le mieux ?
          </p>
          <button
            disabled={isPending}
            onClick={() => handleSaveSellerType("individual")}
            className={cn(
              "flex items-start gap-4 p-4 rounded-xl border border-border bg-card",
              "hover:border-primary hover:bg-primary/5 transition-colors text-left",
              "disabled:opacity-50",
            )}
          >
            <User className="w-6 h-6 mt-0.5 shrink-0 text-primary" />
            <div>
              <p className="text-sm font-bold">Particulier</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Je vends sous mon nom, sans structure juridique enregistrée.
              </p>
            </div>
          </button>
          <button
            disabled={isPending}
            onClick={() => handleSaveSellerType("registered_business")}
            className={cn(
              "flex items-start gap-4 p-4 rounded-xl border border-border bg-card",
              "hover:border-primary hover:bg-primary/5 transition-colors text-left",
              "disabled:opacity-50",
            )}
          >
            <Building2 className="w-6 h-6 mt-0.5 shrink-0 text-primary" />
            <div>
              <p className="text-sm font-bold">Entreprise enregistrée</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Je possède ou travaille pour une entreprise officiellement
                enregistrée.
              </p>
            </div>
          </button>
        </div>
      )}

      {/* Step 4 — Selling channels (multi-select) */}
      {viewingStep === 4 && (
        <div className="flex flex-col gap-3 mt-2">
          <p className="text-sm text-muted-foreground">
            Où vendez-vous ou promouvez-vous votre inventaire aujourd'hui ?
            <br />
            <span className="text-xs">Plusieurs choix possibles.</span>
          </p>
          <div className="flex flex-col gap-2">
            {SELLING_CHANNELS.map((channel) => {
              const isSelected = selectedChannels.includes(channel);
              return (
                <button
                  key={channel}
                  onClick={() => toggleChannel(channel)}
                  className={cn(
                    "flex items-center justify-between px-4 py-3 rounded-xl border transition-colors",
                    "text-sm font-medium text-left",
                    isSelected
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border bg-card text-foreground",
                  )}
                >
                  <span>{channel}</span>
                  {isSelected && <Check className="w-4 h-4 shrink-0" />}
                </button>
              );
            })}
          </div>
          <ButtonV2
            className="w-full bg-primary text-primary-foreground mt-1"
            label="Continuer"
            disabled={isPending || selectedChannels.length === 0}
            onClick={() => handleSaveSellingChannels(selectedChannels)}
          />
        </div>
      )}

      {/* Step 5 — Monthly revenue */}
      {viewingStep === 5 && (
        <div className="flex flex-col gap-2 mt-2">
          <p className="text-sm text-muted-foreground">
            Quel est votre chiffre d'affaires mensuel moyen ?
          </p>
          <OptionList
            options={REVENUE_RANGES}
            onSelect={handleSaveMonthlyRevenue}
            disabled={isPending}
          />
        </div>
      )}

      {/* Step 6 — Item count */}
      {viewingStep === 6 && (
        <div className="flex flex-col gap-2 mt-2">
          <p className="text-sm text-muted-foreground">
            Combien d'articles avez-vous à vendre ?
          </p>
          <OptionList
            options={ITEM_COUNT_RANGES}
            onSelect={handleSaveItemCount}
            disabled={isPending}
          />
        </div>
      )}

      {/* Step 7 — Team size */}
      {viewingStep === 7 && (
        <div className="flex flex-col gap-2 mt-2">
          <p className="text-sm text-muted-foreground">
            Quelle est la taille de votre équipe ?
          </p>
          <OptionList
            options={TEAM_SIZE_RANGES}
            onSelect={handleSaveTeamSize}
            disabled={isPending}
          />
        </div>
      )}

      {/* Step 8 — Live hours */}
      {viewingStep === 8 && (
        <div className="flex flex-col gap-2 mt-2">
          <p className="text-sm text-muted-foreground">
            Combien d'heures par semaine pourriez-vous streamer en live ?
          </p>
          <OptionList
            options={LIVE_HOURS_RANGES}
            onSelect={handleSaveLiveHours}
            disabled={isPending}
          />
        </div>
      )}

      {/* Step 9 — Return address */}
      {viewingStep === 9 && (
        <div className="flex flex-col gap-4 mt-2">
          <p className="text-sm text-muted-foreground">
            Quelle adresse les acheteurs doivent-ils utiliser pour les retours ?
          </p>
          <Input
            type="text"
            label="Adresse"
            placeholder="12 rue de la Paix"
            onChange={(v) => setAddress((a) => ({ ...a, street: v }))}
          />
          <Input
            type="text"
            label="Ville"
            placeholder="Paris"
            onChange={(v) => setAddress((a) => ({ ...a, city: v }))}
          />
          <Input
            type="text"
            label="Code postal"
            placeholder="75001"
            onChange={(v) => setAddress((a) => ({ ...a, zipCode: v }))}
          />
          <Input
            type="text"
            label="Pays"
            placeholder="France"
            onChange={(v) => setAddress((a) => ({ ...a, country: v }))}
          />
          <ButtonV2
            className="w-full bg-primary text-primary-foreground"
            label="Continuer"
            disabled={isPending || !isAddressComplete}
            onClick={() => handleSaveReturnAddress(address)}
          />
        </div>
      )}

      {/* Step 10 — Submit / status */}
      {viewingStep >= 10 && (
        <div className="flex flex-col gap-4 mt-2">
          {(sellerStatus === "none" || sellerStatus === "pending") && (
              <>
                <div className="p-4 rounded-xl bg-card border border-border text-sm text-muted-foreground">
                  Votre profil vendeur est complet. Cliquez pour activer votre
                  compte vendeur.
                </div>
                <ButtonV2
                  className="w-full bg-primary text-primary-foreground"
                  label="Devenir vendeur"
                  disabled={isPending}
                  onClick={handleSubmitApplication}
                />
              </>
            )}

          {sellerStatus === "active" && (
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <span className="text-4xl">🎉</span>
              <p className="font-syne font-extrabold text-lg text-primary">
                Félicitations, vous êtes vendeur !
              </p>
              <p className="text-sm text-muted-foreground">
                Votre compte vendeur est actif. Commencez à vendre dès
                maintenant.
              </p>
              <ButtonV2
                className="w-full bg-primary text-primary-foreground mt-2"
                label="Accéder à mon espace vendeur"
                onClick={() => navigate("/seller/shop")}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
