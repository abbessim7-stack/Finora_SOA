import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type HTMLAttributes,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { addMonths, monthLabel } from '../lib/format';
import { useReveal } from '../lib/useReveal';
import { IconAlert, IconCheck, IconChevronLeft, IconChevronRight, IconClose, IconInfo } from './ui-icons';

export function Card({
  children,
  className = '',
  ...rest
}: { children: ReactNode; className?: string } & HTMLAttributes<HTMLElement>) {
  return (
    <section className={`card ${className}`} {...rest}>
      {children}
    </section>
  );
}

export function Field({
  label,
  hint,
  error,
  children,
  className = '',
}: {
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={`field ${className}`}>
      <span className="field-label">{label}</span>
      {children}
      {error ? (
        <span className="field-hint field-error" role="alert">
          {error}
        </span>
      ) : hint ? (
        <span className="field-hint">{hint}</span>
      ) : null}
    </label>
  );
}

export function ProgressBar({ ratio, danger = false }: { ratio: number; danger?: boolean }) {
  const revealed = useReveal();
  const safe = Number.isFinite(ratio) ? Math.max(0, Math.min(ratio, 1)) : 0;
  return (
    <div
      className={`bar${danger ? ' is-danger' : ''}`}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(Math.min(ratio, 1) * 100)}
    >
      <span style={{ transform: `scaleX(${revealed ? safe : 0})` }} />
    </div>
  );
}

export function Skeleton({ height = 16, width = '100%', radius = 8 }: { height?: number; width?: string | number; radius?: number }) {
  return <span className="skeleton" style={{ height, width, borderRadius: radius }} />;
}

export function EmptyState({
  title,
  description,
  action,
  icon,
}: {
  title: string;
  description: string;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="empty">
      {icon ? <div className="empty-icon">{icon}</div> : null}
      <p className="empty-title">{title}</p>
      <p className="empty-text">{description}</p>
      {action}
    </div>
  );
}

export function MonthSwitcher({ month, onChange }: { month: string; onChange: (month: string) => void }) {
  return (
    <div className="month-switch">
      <button
        type="button"
        className="month-arrow"
        aria-label="Mois précédent"
        onClick={() => onChange(addMonths(month, -1))}
      >
        <IconChevronLeft size={17} />
      </button>
      <span className="month-current">{monthLabel(month)}</span>
      <button
        type="button"
        className="month-arrow"
        aria-label="Mois suivant"
        onClick={() => onChange(addMonths(month, 1))}
      >
        <IconChevronRight size={17} />
      </button>
    </div>
  );
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
}: {
  options: Array<{ value: T; label: string }>;
  value: T;
  onChange: (value: T) => void;
  ariaLabel?: string;
}) {
  return (
    <div className="segmented" role="group" aria-label={ariaLabel}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={value === option.value}
          className={`segment${value === option.value ? ' is-active' : ''}`}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

/* ------------------------------- Toasts ------------------------------- */

type ToastKind = 'success' | 'error' | 'info';

interface ToastItem {
  id: number;
  kind: ToastKind;
  message: string;
}

interface ToastValue {
  show: (message: string, kind?: ToastKind) => void;
}

const ToastContext = createContext<ToastValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const show = useCallback((message: string, kind: ToastKind = 'success') => {
    const id = Date.now() + Math.random();
    setItems((previous) => [...previous, { id, kind, message }]);
    window.setTimeout(() => {
      setItems((previous) => previous.filter((item) => item.id !== id));
    }, 4200);
  }, []);

  const value = useMemo(() => ({ show }), [show]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {createPortal(
        <div className="toaster" aria-live="polite">
          {items.map((item) => (
            <div key={item.id} className={`toast toast-${item.kind}`}>
              <span className="toast-icon">
                {item.kind === 'success' ? <IconCheck size={15} /> : item.kind === 'error' ? <IconAlert size={15} /> : <IconInfo size={15} />}
              </span>
              <span>{item.message}</span>
            </div>
          ))}
        </div>,
        document.body,
      )}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastValue {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast doit être utilisé dans ToastProvider');
  return context;
}

/* -------------------------------- Modal ------------------------------- */

export function Modal({
  open,
  title,
  description,
  onClose,
  children,
  footer,
  size = 'md',
}: {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md';
}) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const focusTarget = panelRef.current?.querySelector<HTMLElement>('input, select, textarea');
    focusTarget?.focus();
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      className="overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        className={`modal modal-${size}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="modal-head">
          <div>
            <h2 className="modal-title">{title}</h2>
            {description ? <p className="modal-subtitle">{description}</p> : null}
          </div>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Fermer">
            <IconClose size={18} />
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer ? <div className="modal-foot">{footer}</div> : null}
      </div>
    </div>,
    document.body,
  );
}
