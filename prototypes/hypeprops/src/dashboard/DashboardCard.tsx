/** shared card chrome for dashboard modules */
export default function DashboardCard({
  title,
  right,
  children,
  className = '',
}: {
  title: string
  right?: React.ReactNode
  children: React.ReactNode
  className?: string
}) {
  return (
    <section className={`rounded-xl border border-kick-border bg-kick-panel p-4 ${className}`}>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-[13px] font-bold uppercase tracking-wide text-kick-muted">{title}</h2>
        {right}
      </div>
      {children}
    </section>
  )
}
