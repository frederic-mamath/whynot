export default function SellerGoPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-6">
      <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center">
        <span className="font-syne font-extrabold text-2xl text-primary-foreground">
          GO
        </span>
      </div>
      <h1 className="font-syne font-extrabold text-xl text-foreground">
        Lancer un live
      </h1>
      <p className="text-muted-foreground text-sm text-center font-outfit">
        Bientôt disponible
      </p>
    </div>
  );
}
