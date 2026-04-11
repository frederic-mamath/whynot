import { cn } from "@/lib/utils";

interface Props {
  children: React.ReactNode;
  className?: string;
}

const MobilePage = ({ children, className }: Props) => {
  return (
    <div className={cn("min-h-screen w-full", "bg-b-fourth", "p-6 lg:px-12 lg:py-10 lg:max-w-3xl lg:mx-auto", className)}>
      {children}
    </div>
  );
};

export default MobilePage;
