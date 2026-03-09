import { Compass } from "lucide-react";

export default function SellerExplorerPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-6">
      <Compass className="w-12 h-12 text-muted-foreground" />
      <h1 className="font-syne font-extrabold text-xl text-foreground">
        Explorer
      </h1>
      <p className="text-muted-foreground text-sm text-center font-outfit">
        Bientôt disponible
      </p>
    </div>
  );
}
