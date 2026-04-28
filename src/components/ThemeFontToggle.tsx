import { Moon, Sun, Type } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FONT_OPTIONS, useAppSettings } from "@/hooks/useAppSettings";

export const ThemeToggle = () => {
  const { theme, toggleTheme } = useAppSettings();
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
    >
      {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
    </Button>
  );
};

export const FontPicker = () => {
  const { font, setFont } = useAppSettings();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Font family">
          <Type className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>Font family</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {FONT_OPTIONS.map((f) => (
          <DropdownMenuItem
            key={f.id}
            onClick={() => setFont(f.id)}
            style={{ fontFamily: f.stack }}
            className={font === f.id ? "bg-accent/20 font-semibold" : ""}
          >
            {f.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
