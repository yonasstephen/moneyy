export function PageShell({
  title,
  children,
  actions,
}: {
  title: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">{title}</h1>
        {actions && <div className="flex gap-2">{actions}</div>}
      </div>
      {children}
    </div>
  );
}
