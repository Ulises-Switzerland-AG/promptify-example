"use client";

import { useState } from "react";
import { Icon } from "./ui-icon";

export function CopyPrompt({ content, iconOnly = false }: { content: string; iconOnly?: boolean }) {
  const [status, setStatus] = useState<"idle" | "copied" | "error">("idle");
  async function copy() {
    try {
      await navigator.clipboard.writeText(content);
      setStatus("copied");
    } catch {
      setStatus("error");
    }
  }
  return (
    <div className="copy-control">
      <button className={`button button-primary${iconOnly ? " icon-button" : ""}`} type="button" aria-label="Copiar Prompt" title="Copiar Prompt" onClick={copy}><Icon name={status === "copied" ? "check" : "copy"} />{!iconOnly && (status === "copied" ? "Prompt copiado" : "Copiar Prompt")}</button>
      <span role={status === "error" ? "alert" : "status"}>{status === "error" ? "No se pudo copiar. Selecciona el texto y cópialo manualmente." : status === "copied" ? "Listo para pegar donde lo necesites." : ""}</span>
    </div>
  );
}
