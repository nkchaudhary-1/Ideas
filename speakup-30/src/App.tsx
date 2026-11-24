import { useEffect } from "react";
import { Shell } from "./components/Shell";
import { Welcome } from "./screens/Welcome";
import { Dashboard } from "./screens/Dashboard";
import { Practice } from "./screens/Practice";
import { TeleprompterScreen } from "./screens/TeleprompterScreen";
import { ChallengeScreen } from "./screens/ChallengeScreen";
import { AnalysisScreen } from "./screens/AnalysisScreen";
import { ProgressScreen } from "./screens/ProgressScreen";
import { CurriculumScreen } from "./screens/CurriculumScreen";
import { SettingsScreen } from "./screens/SettingsScreen";
import { useRoute } from "./lib/router";
import { useStore } from "./lib/store";

function useTheme() {
  const theme = useStore((s) => s.data.settings.theme);
  useEffect(() => {
    const apply = () => {
      const t = theme === "system" ? (matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark") : theme;
      document.documentElement.dataset.theme = t;
      document.querySelector('meta[name="theme-color"]')?.setAttribute("content", t === "light" ? "#F6F6F3" : "#0C0D10");
    };
    apply();
    if (theme !== "system") return;
    const mq = matchMedia("(prefers-color-scheme: light)");
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, [theme]);
}

export default function App() {
  useTheme();
  const route = useRoute();
  const welcomed = useStore((s) => s.data.welcomed || s.data.sessions.length > 0 || s.data.attempts.length > 0);
  if (!welcomed) return <Welcome />;

  const [screen = "", a, b] = route;
  const focus = screen === "practice" && b === "run";
  let body;
  switch (screen) {
    case "practice":
      body = <Practice dayParam={a} mode={b} />;
      break;
    case "teleprompter":
      body = <TeleprompterScreen dayParam={a} />;
      break;
    case "challenge":
      body = <ChallengeScreen dayParam={a} />;
      break;
    case "analysis":
      body = <AnalysisScreen attemptId={a} />;
      break;
    case "progress":
      body = <ProgressScreen />;
      break;
    case "curriculum":
      body = <CurriculumScreen dayParam={a} />;
      break;
    case "settings":
      body = <SettingsScreen />;
      break;
    default:
      body = <Dashboard />;
  }
  return (
    <Shell route={["practice", "teleprompter", "challenge", "analysis", "progress", "curriculum", "settings"].includes(screen) ? screen : ""} focus={focus}>
      {body}
    </Shell>
  );
}
