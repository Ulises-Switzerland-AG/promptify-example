"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { handleModalCancel } from "./modal-cancel";
import { Icon } from "./ui-icon";

export function PromptModal({ title, libraryHref, children }: {
  title: string; libraryHref: string; children: ReactNode;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const router = useRouter();
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    const opener = document.activeElement;
    const previousOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    element.showModal();
    return () => {
      element.close();
      document.documentElement.style.overflow = previousOverflow;
      if (opener instanceof HTMLElement && opener.isConnected) opener.focus({ preventScroll: true });
    };
  }, []);

  function dismiss() {
    if (dialog.current?.querySelector('form[aria-busy="true"]')) {
      setNotice("Espera a que termine la operación antes de cerrar.");
      return;
    }
    router.push(libraryHref, { scroll: false });
  }

  return <dialog ref={dialog} className="prompt-modal" aria-labelledby="prompt-modal-title"
    onCancel={(event) => handleModalCancel(event, dismiss)}
    onClick={(event) => {
      if (event.target !== event.currentTarget) return;
      const bounds = event.currentTarget.getBoundingClientRect();
      if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dismiss();
    }}>
    <header className="prompt-modal-header">
      <h1 id="prompt-modal-title" tabIndex={-1} autoFocus>{title}</h1>
      <button type="button" className="button button-secondary icon-button" aria-label="Cerrar Prompt" title="Cerrar Prompt" onClick={dismiss}><Icon name="close" /></button>
    </header>
    {notice && <p className="form-error" role="status">{notice}</p>}
    <div className="prompt-modal-body">{children}</div>
  </dialog>;
}
