"use client";

import Link from "next/link";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="empty-state error-state" role="alert">
      <h1>No pudimos abrir la biblioteca</h1>
      <p>Ha ocurrido un problema al cargar Promptify. Reintenta la solicitud o vuelve al inicio.</p>
      <div className="error-actions"><button type="button" className="button button-primary" onClick={reset}>Reintentar</button><Link className="button button-secondary" href="/">Volver al inicio</Link></div>
    </main>
  );
}
