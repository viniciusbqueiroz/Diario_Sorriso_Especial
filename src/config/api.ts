import { NativeModules, Platform } from "react-native";

function getDevMachineUrl(): string | null {
  const sourceCode = (NativeModules as { SourceCode?: { scriptURL?: string } })
    .SourceCode;
  const scriptURL = sourceCode?.scriptURL;

  if (!scriptURL) {
    return null;
  }

  try {
    const host = new URL(scriptURL).hostname;
    if (!host) {
      return null;
    }

    return `http://${host}:3333`;
  } catch {
    return null;
  }
}

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ??
  (__DEV__
    ? (getDevMachineUrl() ??
      (Platform.OS === "android"
        ? "http://10.0.2.2:3333"
        : "http://localhost:3333"))
    : "https://diario-sorriso-backend.vercel.app");
