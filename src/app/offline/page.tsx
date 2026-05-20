export default function OfflinePage() {
  return (
    <main className="min-h-screen px-5 py-10 sm:px-8">
      <div className="mx-auto flex min-h-[70vh] max-w-xl flex-col justify-center rounded-[28px] border border-white/8 bg-[#080c14]/76 p-6 text-center backdrop-blur sm:p-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-muted">Offline</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-white">You&apos;re offline right now</h1>
        <p className="mt-4 text-sm leading-7 text-muted sm:text-base">
          EndlessTimer can still reopen pages you already visited, but live Firebase data needs a connection. Reconnect
          and refresh to continue syncing your timer history.
        </p>
      </div>
    </main>
  );
}
