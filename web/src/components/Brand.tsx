export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <span className={`brand${compact ? ' brand-compact' : ''}`}>
      <span className="brand-mark" aria-hidden="true">
        <span className="brand-mark-inner" />
      </span>
      <span className="brand-word">Finora</span>
    </span>
  );
}
