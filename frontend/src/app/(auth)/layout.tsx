export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-zinc-950 px-4">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(251,191,36,0.18),_rgba(9,9,11,1)_45%)]" />
      <div className="pointer-events-none absolute -top-40 right-0 h-80 w-80 rounded-full bg-amber-300/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 left-0 h-80 w-80 rounded-full bg-amber-500/10 blur-3xl" />
      <div className="relative z-10 w-full">{children}</div>
    </div>
  )
}
