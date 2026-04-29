export interface SocialProofProps {
  speedPromise: string;
  socialCount: string;
  consentText: string;
}

function ProofRow({ children }: { children: React.ReactNode }) {
  return (
    <div className="inline-flex items-center gap-3 rounded-full border border-border bg-[var(--color-surface)] px-4 py-2 text-sm font-medium text-primary">
      <span
        className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[var(--color-accent-light)] text-[var(--color-accent)]"
        data-testid="social-proof-checkmark"
        aria-hidden="true"
      >
        *
      </span>
      <span>{children}</span>
    </div>
  );
}

export function SocialProof({
  speedPromise,
  socialCount,
  consentText,
}: SocialProofProps) {
  return (
    <div className="mt-6 flex flex-col items-center gap-3 text-center">
      <div className="flex flex-col items-center gap-3">
        <ProofRow>{speedPromise}</ProofRow>
        <ProofRow>{socialCount}</ProofRow>
      </div>
      <p className="max-w-xl text-xs leading-relaxed text-[color:var(--color-muted)]">
        {consentText}
      </p>
    </div>
  );
}
