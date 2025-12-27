import { Moon, Sun } from "lucide-react";
import { useTheme } from "../../ThemeProvider";
import Button from "../Button";

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    if (theme === "light") {
      setTheme("dark");
    } else if (theme === "dark") {
      setTheme("system");
    } else {
      setTheme("light");
    }
  };

  const getIcon = () => {
    if (theme === "dark") {
      return <Moon className="size-4" />;
    }
    return <Sun className="size-4" />;
  };

  const getLabel = () => {
    if (theme === "dark") return "Dark";
    if (theme === "light") return "Light";
    return "System";
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      aria-label={`Current theme: ${getLabel()}. Click to toggle.`}
      title={`Theme: ${getLabel()}`}
    >
      {getIcon()}
    </Button>
  );
}
