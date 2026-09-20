export type BusinessThemeId =
  | "cyberNight"
  | "defaultTheme"
  | "blockchainFlow"
  | "vietnamFuture";

export interface ThemeSwatch {
  background: string;
  surface: string;
  primary: string;
  border: string;
}

export interface BusinessThemeMeta {
  id: BusinessThemeId;
  label: string;
  description: string;
  mode: "light" | "dark";
  swatch: ThemeSwatch;
}

export const BUSINESS_THEMES: Record<BusinessThemeId, BusinessThemeMeta> = {
  cyberNight: {
    id: "cyberNight",
    label: "Cyber Night",
    description: "Chế độ nền tối huyền ảo",
    mode: "dark",
    swatch: {
      background: "#070A11",
      surface: "#0F172A",
      primary: "#00D2FF",
      border: "#1E293B",
    },
  },
  defaultTheme: {
    id: "defaultTheme",
    label: "Nova Banking",
    description: "Giao diện ngân hàng tinh giản hiện đại",
    mode: "light",
    swatch: {
      background: "#F8F9FA",
      surface: "#FFFFFF",
      primary: "#1E60D5",
      border: "#E5E9EF",
    },
  },
  blockchainFlow: {
    id: "blockchainFlow",
    label: "Blockchain Flow",
    description: "Sắc thái gradient Web3 động",
    mode: "dark",
    swatch: {
      background: "#080E24",
      surface: "#101C3D",
      primary: "#38BDF8",
      border: "#223566",
    },
  },
  vietnamFuture: {
    id: "vietnamFuture",
    label: "Vietnam Future",
    description: "Bản sắc Việt Nam, tông sáng & vàng hoàng kim",
    mode: "light",
    swatch: {
      background: "#FAF7F2",
      surface: "#FFFFFF",
      primary: "#A16B0A",
      border: "#EBE2CF",
    },
  },
};

export const THEME_STORAGE_KEY = "nivex.business.theme";
export const DEFAULT_BUSINESS_THEME_ID: BusinessThemeId = "cyberNight";

export function isBusinessThemeId(value: unknown): value is BusinessThemeId {
  return (
    typeof value === "string" &&
    (value === "cyberNight" ||
      value === "defaultTheme" ||
      value === "blockchainFlow" ||
      value === "vietnamFuture")
  );
}

export type ThemeConfig = BusinessThemeMeta;

export function getInitialThemeId(): BusinessThemeId {
  if (typeof window === "undefined") return DEFAULT_BUSINESS_THEME_ID;
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (isBusinessThemeId(stored)) {
      return stored;
    }
  } catch {
    // Ignore localStorage access issues
  }
  return DEFAULT_BUSINESS_THEME_ID;
}

export function setStoredThemeId(themeId: BusinessThemeId): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, themeId);
  } catch {
    // Ignore localStorage access issues
  }
}
