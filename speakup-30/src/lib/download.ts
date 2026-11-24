// Saving a backup file. In a browser a download link works. Inside the artifact viewer a link does nothing, so there the
// file goes through the viewer's "downloads" capability, which asks the person to confirm the save.
import { IN_ARTIFACT } from "./env";

interface DownloadsApi {
  save(r: { filename: string; data: string }): Promise<{ status: string }>;
}
let api: DownloadsApi | null = null;
const host = typeof window !== "undefined" ? (window as unknown as { claude?: { use(n: string): Promise<unknown> } }).claude : undefined;
if (IN_ARTIFACT && host?.use) {
  host
    .use("downloads")
    .then((d) => (api = (d as DownloadsApi | null) ?? null))
    .catch(() => (api = null));
}

export type SaveOutcome = "saved" | "declined" | "unavailable";

export async function saveTextFile(filename: string, text: string, mime = "application/json"): Promise<SaveOutcome> {
  if (IN_ARTIFACT) {
    if (!api) return "unavailable";
    try {
      await api.save({ filename, data: text });
      return "saved";
    } catch (e) {
      return (e as { code?: string }).code === "declined" ? "declined" : "unavailable";
    }
  }
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([text], { type: mime }));
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  return "saved";
}
