import { createRoot } from "react-dom/client";
import EditorShell from "@/components/editor/EditorShell";
import { preloadFonts } from "@/lib/fonts";

// The page is served from a folder of static files, so bundled assets are fetched relatively.
(globalThis as { __ASSET_BASE__?: string }).__ASSET_BASE__ = "";

// UI chrome font (the Next build declares these in CSS; here they load as bytes)
void preloadFonts([{ family: "Inter", weight: 400 }, { family: "Inter", weight: 500 }, { family: "Inter", weight: 600 }]);

createRoot(document.getElementById("root")!).render(<EditorShell />);
