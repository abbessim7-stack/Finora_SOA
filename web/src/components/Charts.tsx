import { useState } from 'react';
import type { CategorySlice, Id, TrendPoint } from '../lib/types';
import { formatMoney, formatNumber, shortMonth } from '../lib/format';
import { useReveal } from '../lib/useReveal';
import { categoryColor } from './Icons';

const INCOME = '#4fd8a4';
const EXPENSE = '#ff8078';
const BALANCE = '#b6a6ff';

export function DonutChart({ slices, total }: { slices: CategorySlice[]; total: number }) {
  const revealed = useReveal();
  const [active, setActive] = useState<Id | null>(null);
  const radius = 62;
  const circumference = 2 * Math.PI * radius;
  let cursor = 0;

  return (
    <div className="donut-layout">
      <div className="donut-wrap">
        <svg viewBox="0 0 160 160" className="donut-svg" role="img" aria-label="Répartition des dépenses par catégorie">
          <circle cx="80" cy="80" r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={17} />
          <g transform="rotate(-90 80 80)">
            {slices.map((slice) => {
              const length = total > 0 ? (slice.total / total) * circumference : 0;
              const gap = Math.min(7, length * 0.34);
              const dash = Math.max(length - gap, 0.8);
              const offset = -cursor;
              cursor += length;
              const dimmed = active !== null && active !== slice.categoryId;
              return (
                <circle
                  key={slice.categoryId}
                  cx={80}
                  cy={80}
                  r={radius}
                  fill="none"
                  stroke={categoryColor(slice.name)}
                  strokeWidth={active === slice.categoryId ? 20 : 17}
                  strokeLinecap="round"
                  strokeDasharray={`${revealed ? dash : 0} ${circumference}`}
                  strokeDashoffset={offset}
                  className="donut-arc"
                  style={{
                    opacity: dimmed ? 0.28 : 1,
                    transition:
                      'stroke-dasharray 820ms var(--ease-out), stroke-width 180ms ease, opacity 180ms ease',
                  }}
                  onMouseEnter={() => setActive(slice.categoryId)}
                  onMouseLeave={() => setActive(null)}
                />
              );
            })}
          </g>
        </svg>
        <div className="donut-center">
          <span className="donut-center-label">Dépenses</span>
          <strong className="donut-center-value">{formatMoney(total, { compact: true })}</strong>
          <span className="donut-center-sub">{slices.length} catégorie{slices.length > 1 ? 's' : ''}</span>
        </div>
      </div>

      <ul className="donut-legend">
        {slices.map((slice) => (
          <li
            key={slice.categoryId}
            className={`legend-row${active === slice.categoryId ? ' is-active' : ''}`}
            onMouseEnter={() => setActive(slice.categoryId)}
            onMouseLeave={() => setActive(null)}
          >
            <span className="legend-dot" style={{ background: categoryColor(slice.name) }} />
            <span className="legend-name">{slice.name}</span>
            <span className="legend-share">{Math.round(slice.share * 100)} %</span>
            <span className="legend-value">{formatMoney(slice.total)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function TrendChart({ points }: { points: TrendPoint[] }) {
  const revealed = useReveal();
  const width = 680;
  const height = 252;
  const padTop = 18;
  const padBottom = 32;
  const plotHeight = height - padTop - padBottom;

  const max = Math.max(1, ...points.flatMap((point) => [point.income, point.expense, point.balance]));
  const min = Math.min(0, ...points.map((point) => point.balance));
  const span = max - min || 1;
  const toY = (value: number) => padTop + plotHeight - ((value - min) / span) * plotHeight;
  const slot = width / Math.max(points.length, 1);
  const barWidth = 10;
  const zeroY = toY(0);
  const line = points.map((point, index) => `${slot * index + slot / 2},${toY(point.balance)}`).join(' ');

  return (
    <div className="trend">
      <div className="chart-legend">
        <span className="legend-chip">
          <i style={{ background: INCOME }} /> Revenus
        </span>
        <span className="legend-chip">
          <i style={{ background: EXPENSE }} /> Dépenses
        </span>
        <span className="legend-chip">
          <i style={{ background: BALANCE }} /> Solde
        </span>
      </div>

      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="trend-svg"
        role="img"
        aria-label="Évolution des revenus, des dépenses et du solde sur plusieurs mois"
      >
        {[0.25, 0.5, 0.75].map((fraction) => (
          <line
            key={fraction}
            x1={0}
            x2={width}
            y1={padTop + plotHeight * fraction}
            y2={padTop + plotHeight * fraction}
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={1}
            strokeDasharray="2 6"
          />
        ))}
        <line x1={0} x2={width} y1={zeroY} y2={zeroY} stroke="rgba(255,255,255,0.16)" strokeWidth={1} />

        {points.map((point, index) => {
          const center = slot * index + slot / 2;
          const incomeHeight = Math.max(1, zeroY - toY(point.income));
          const expenseHeight = Math.max(1, zeroY - toY(point.expense));
          return (
            <g key={point.month}>
              <rect
                x={center - barWidth - 2}
                y={toY(point.income)}
                width={barWidth}
                height={incomeHeight}
                rx={4}
                fill={INCOME}
                className="trend-bar"
                style={{ transform: `scaleY(${revealed ? 1 : 0})` }}
              />
              <rect
                x={center + 2}
                y={toY(point.expense)}
                width={barWidth}
                height={expenseHeight}
                rx={4}
                fill={EXPENSE}
                className="trend-bar"
                style={{ transform: `scaleY(${revealed ? 1 : 0})`, transitionDelay: '60ms' }}
              />
              <text x={center} y={height - 8} textAnchor="middle" className="axis-label">
                {shortMonth(point.month)}
              </text>
            </g>
          );
        })}

        <polyline
          points={line}
          fill="none"
          stroke={BALANCE}
          strokeWidth={2.2}
          strokeLinecap="round"
          strokeLinejoin="round"
          pathLength={100}
          strokeDasharray={100}
          strokeDashoffset={revealed ? 0 : 100}
          style={{ transition: 'stroke-dashoffset 900ms var(--ease-out)' }}
        />
        {points.map((point, index) => (
          <circle
            key={`dot-${point.month}`}
            cx={slot * index + slot / 2}
            cy={toY(point.balance)}
            r={3.4}
            fill="#0b0a16"
            stroke={BALANCE}
            strokeWidth={2}
            style={{ opacity: revealed ? 1 : 0, transition: 'opacity 320ms ease 420ms' }}
          />
        ))}
      </svg>
    </div>
  );
}

export function Sparkline({
  values,
  height = 64,
  color = BALANCE,
}: {
  values: number[];
  height?: number;
  color?: string;
}) {
  const revealed = useReveal();
  const width = 300;
  const safeValues = values.length > 1 ? values : [0, 0];
  const max = Math.max(...safeValues);
  const min = Math.min(...safeValues, 0);
  const span = max - min || 1;
  const stepX = width / Math.max(safeValues.length - 1, 1);
  const points = safeValues.map((value, index) => {
    const x = index * stepX;
    const y = height - 6 - ((value - min) / span) * (height - 12);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const area = `M0,${height} L${points.join(' L')} L${width},${height} Z`;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="sparkline"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.34" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#sparkFill)" style={{ opacity: revealed ? 1 : 0, transition: 'opacity 500ms ease 200ms' }} />
      <polyline
        points={points.join(' ')}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
        pathLength={100}
        strokeDasharray={100}
        strokeDashoffset={revealed ? 0 : 100}
        style={{ transition: 'stroke-dashoffset 900ms var(--ease-out)' }}
      />
    </svg>
  );
}

export function ValueBullet({ value, previous }: { value: number; previous: number }) {
  if (!previous) return null;
  const delta = ((value - previous) / Math.abs(previous)) * 100;
  const up = delta >= 0;
  return (
    <span className={`delta${up ? ' is-up' : ' is-down'}`}>
      {up ? '↑' : '↓'} {formatNumber(Math.abs(delta))} %
    </span>
  );
}
