import { createContext, useContext, useEffect, useState, ReactNode } from "react";

type Theme = "light" | "dark";

export const FONT_OPTIONS = [
  { id: "inter", label: "Inter (Modern Sans)", stack: "'Inter', system-ui, sans-serif" },
  { id: "poppins", label: "Poppins (Friendly)", stack: "'Poppins', system-ui, sans-serif" },
  { id: "roboto", label: "Roboto (Clean)", stack: "'Roboto', system-ui, sans-serif" },
  { id: "montserrat", label: "Montserrat (Geometric)", stack: "'Montserrat', system-ui, sans-serif" },
  { id: "nunito", label: "Nunito (Rounded)", stack: "'Nunito', system-ui, sans-serif" },
  { id: "playfair", label: "Playfair Display (Elegant)", stack: "'Playfair Display', Georgia, serif" },
  { id: "lora", label: "Lora (Editorial)", stack: "'Lora', Georgia, serif" },
  { id: "merriweather", label: "Merriweather (Classic)", stack: "'Merriweather', Georgia, serif" },
] as const;

export type FontId = typeof FONT_OPTIONS[number]["id"];

interface SettingsCtx {
  theme: Theme;
  setTheme: (t: Theme) => void;
  toggleTheme: () => void;
  font: FontId;
  setFont: (f: FontId) => void;
}

const Ctx = createContext<SettingsCtx | null>(null);

export const AppSettingsProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setThemeState] = useState<Theme>(() =>
    (localStorage.getItem("ns-theme") as Theme) || "light"
  );
  const [font, setFontState] = useState<FontId>(() =>
    (localStorage.getItem("ns-font") as FontId) || "inter"
  );

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    localStorage.setItem("ns-theme", theme);
  }, [theme]);

  useEffect(() => {
    const stack = FONT_OPTIONS.find((f) => f.id === font)?.stack ?? FONT_OPTIONS[0].stack;
    document.documentElement.style.setProperty("--app-font", stack);
    localStorage.setItem("ns-font", font);
  }, [font]);

  return (
    <Ctx.Provider
      value={{
        theme,
        setTheme: setThemeState,
        toggleTheme: () => setThemeState((t) => (t === "light" ? "dark" : "light")),
        font,
        setFont: setFontState,
      }}
    >
      {children}
    </Ctx.Provider>
  );
};

export const useAppSettings = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAppSettings must be used within AppSettingsProvider");
  return c;
};
