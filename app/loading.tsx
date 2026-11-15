import { Brand } from "./components/brand";

export default function Loading() {
  return (
    <div className="supporting-page" aria-busy="true" role="status">
      <header className="supporting-header"><Brand /></header>
      <main className="loading-content">
        <span className="sr-only">Cargando la biblioteca de Prompts…</span>
        <div className="loading-intro" aria-hidden="true" />
        <div className="prompt-grid" aria-hidden="true">
          {Array.from({ length: 6 }, (_, index) => <div key={index} className="loading-card"><span /><span /><span /></div>)}
        </div>
      </main>
    </div>
  );
}
