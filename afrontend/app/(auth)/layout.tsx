export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-paper flex items-center justify-center px-4 py-12 text-ink">
      <div className="w-full max-w-md">
        {/* Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded border-[1.5px] border-ink bg-ink text-paper mb-3 shadow-[2px_2px_0_0_var(--color-ink)]">
            <span className="font-serif font-bold text-2xl">A</span>
          </div>
          <div className="flex items-baseline justify-center gap-1">
            <h1 className="font-serif text-3xl font-bold text-ink tracking-tight">
              Arthsaathi
            </h1>
            <span className="w-2 h-2 rounded-full bg-marigold inline-block" />
          </div>
          <p className="font-mono text-xs uppercase tracking-wider text-ink/70 mt-1">
            Your Digital Financial Companion
          </p>
        </div>

        {children}
      </div>
    </div>
  );
}
