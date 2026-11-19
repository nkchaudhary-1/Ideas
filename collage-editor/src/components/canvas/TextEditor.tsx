"use client";
import { useEffect, useRef } from "react";
import type { TextEl } from "@/lib/types";
import { fontStack, nearestWeight, fontByFamily } from "@/lib/fonts";
import { useStore } from "@/lib/store";
import { transformText } from "./ElementNode";

/** DOM textarea laid exactly over the Konva text while editing (the canvas has no native text input). */
export default function TextEditor({ el, view }: { el: TextEl; view: { scale: number; x: number; y: number } }) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const s = view.scale;
  const nw = nearestWeight(fontByFamily(el.fontFamily), el.fontWeight, el.italic);
  const fill = el.fill.type === "solid" ? el.fill.color : el.fill.stops[0]?.color ?? "#fff";

  useEffect(() => {
    const t = ref.current;
    if (!t) return;
    t.focus();
    t.setSelectionRange(0, t.value.length);
  }, []);

  useEffect(() => {
    const t = ref.current;
    if (!t) return;
    t.style.height = "0px";
    t.style.height = Math.max(el.height * s, t.scrollHeight) + "px";
  }, [el.text, el.fontSize, el.width, s, el.height]);

  const end = () => {
    const st = useStore.getState();
    const cur = st.project.slides.find((x) => x.id === st.project.activeSlideId)?.elements.find((e) => e.id === el.id) as TextEl | undefined;
    st.setUI({ editingTextId: null });
    if (cur && !cur.text.trim()) st.deleteElements([el.id]);
  };

  return (
    <textarea
      ref={ref}
      value={el.text}
      spellCheck={false}
      onChange={(e) => useStore.getState().updateElement(el.id, { text: e.target.value }, { key: "text-" + el.id })}
      onBlur={end}
      onKeyDown={(e) => {
        e.stopPropagation();
        if (e.key === "Escape") { e.preventDefault(); ref.current?.blur(); }
      }}
      style={{
        position: "absolute",
        left: view.x + el.x * s,
        top: view.y + el.y * s,
        width: el.width * s,
        minHeight: el.height * s,
        transform: `rotate(${el.rotation}deg)`,
        transformOrigin: "50% 50%",
        fontFamily: fontStack(el.fontFamily),
        fontSize: el.fontSize * s,
        fontWeight: nw.weight,
        fontStyle: nw.italic || el.italic ? "italic" : "normal",
        lineHeight: el.lineHeight,
        letterSpacing: el.letterSpacing * s,
        textAlign: el.align === "justify" ? "justify" : el.align,
        textTransform: el.textTransform === "capitalize" ? "capitalize" : el.textTransform === "none" ? "none" : el.textTransform,
        textDecoration: [el.underline ? "underline" : "", el.strike ? "line-through" : ""].join(" ").trim() || "none",
        color: fill,
        padding: el.padding * s,
        margin: 0,
        border: "none",
        outline: "1.5px solid rgb(var(--accent))",
        background: "transparent",
        resize: "none",
        overflow: "hidden",
        whiteSpace: "pre-wrap",
        wordBreak: "break-word",
        caretColor: "rgb(var(--accent))",
        zIndex: 20,
        userSelect: "text",
      }}
    />
  );
}
export { transformText };
