export function ModuleShell({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children?: React.ReactNode;
}) {
  return (
    <section className="neon-card rounded-2xl p-5">
      <h1 className="glitch-title neon-text text-2xl font-bold" data-text={title}>
        {title}
      </h1>
      <p className="mt-2 text-sm text-emerald-200/80">{description}</p>
      {children ? <div className="mt-4">{children}</div> : null}
    </section>
  );
}
