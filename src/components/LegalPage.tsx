import type { ReactNode } from "react";

export function LegalPage({
  title,
  intro,
  children,
}: {
  children: ReactNode;
  intro: string;
  title: string;
}) {
  return (
    <section className="page-shell legal-page mx-auto max-w-5xl px-4 pb-12">
      <header className="legal-hero panel">
        <p className="tech-label">PUBLIC INFORMATION</p>
        <h1>{title}</h1>
        <p>{intro}</p>
      </header>
      <div className="legal-content">{children}</div>
    </section>
  );
}
