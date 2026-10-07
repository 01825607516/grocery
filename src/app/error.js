"use client";

// Something unexpected broke while showing a page.
export default function Error({ reset }) {
  return (
    <div className="grid min-h-screen place-items-center bg-cream p-6 text-center">
      <div className="max-w-md rounded-2xl bg-white p-8 shadow-md ring-1 ring-black/5">
        <p className="font-display text-xl font-semibold text-primary-dark">Something went wrong</p>
        <p className="mt-1 text-sm text-ink/60">Please try again. If it keeps happening, call us on 09 4932 4782.</p>
        <div className="mt-5 flex justify-center gap-2"><button onClick={reset} className="btn">Try again</button><a href="/" className="rounded-lg border border-primary px-4 py-2.5 text-sm font-semibold text-primary">Go home</a></div>
      </div>
    </div>
  );
}
