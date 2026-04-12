import { cn } from "@/lib/utils";

interface Props {
  children: React.ReactNode;
  className?: string;
}

const MobilePage = ({ children, className }: Props) => {
  return (
    <div className={cn("min-h-screen w-full", "bg-b-fourth", "p-6 md:px-12 md:py-10 md:max-w-3xl md:mx-auto", className)}>
      {children}
    </div>
  );
};

export default MobilePage;
