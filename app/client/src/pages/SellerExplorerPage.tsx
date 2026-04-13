import { useNavigate } from "react-router-dom";
import { BarChart2, ChevronLeft } from "lucide-react";

export default function SellerExplorerPage() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col pt-6">
      <div className="flex items-center gap-3 mb-8">
        <button
          onClick={() => navigate("/seller")}
          className="text-muted hover:text-foreground transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="font-syne font-extrabold text-xl text-foreground">
          Analytics et dashboard
        </h1>
      </div>
      <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
        <BarChart2 className="w-14 h-14 text-primary" />
        <p className="font-outfit font-semibold text-base text-foreground">
          Bientôt disponible
        </p>
        <p className="text-sm text-muted max-w-xs">
          Suivez vos revenus, analysez vos performances et retirez votre argent
          directement depuis cette page.
        </p>
      </div>
    </div>
  );
}
