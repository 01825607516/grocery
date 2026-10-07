// Centered title inside a deep-green pill, with fading brass rules on both sides.
export default function SectionHeading({ title, right }) {
  return (
    <div className="mb-4 flex flex-col items-center gap-3">
      <div className="flex w-full items-center gap-3 md:gap-5">
        <span className="h-px flex-1 bg-gradient-to-r from-transparent to-accent/80" />
        <h2 className="rounded-full bg-coffee px-6 py-2 text-center font-display text-lg font-semibold tracking-wide text-cream shadow-md ring-1 ring-accent ring-offset-2 ring-offset-cream md:px-10 md:text-2xl">{title}</h2>
        <span className="h-px flex-1 bg-gradient-to-l from-transparent to-accent/80" />
      </div>
      {right}
    </div>
  );
}
