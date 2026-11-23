import type { CSSProperties } from 'react';
import { categoryColor, categoryIcon } from './Icons';

export function CategoryChip({ name }: { name: string }) {
  const Icon = categoryIcon(name);
  const color = categoryColor(name);
  return (
    <span className="chip" style={{ '--chip': color } as CSSProperties}>
      <Icon size={13} />
      {name}
    </span>
  );
}

export function CategoryAvatar({ name, size = 38 }: { name: string; size?: number }) {
  const Icon = categoryIcon(name);
  const color = categoryColor(name);
  return (
    <span
      className="cat-avatar"
      style={{ '--chip': color, width: size, height: size } as CSSProperties}
      aria-hidden="true"
    >
      <Icon size={Math.round(size * 0.48)} />
    </span>
  );
}
