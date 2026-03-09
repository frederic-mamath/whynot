import { Radio } from "lucide-react";

export default function SellerLivesPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-6">
      <Radio className="w-12 h-12 text-muted-foreground" />
      <h1 className="font-syne font-extrabold text-xl text-foreground">
        Lives
      </h1>
      <p className="text-muted-foreground text-sm text-center font-outfit">
        Bientôt disponible
      </p>
    </div>
  );
}
