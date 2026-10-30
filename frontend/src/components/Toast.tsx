import { useEffect, useState, useCallback, useRef } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Info } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
  exiting: boolean;
}

const ICON_MAP = {
  success:  CheckCircle2,
  error:    XCircle,
  warning:  AlertTriangle,
  info:     Info,
};

const COLOR_MAP: Record<ToastType, { icon: string }> = {
  success:  { icon: 'oklch(0.55 0.18 145)' },
  error:    { icon: 'oklch(0.52 0.22 21)' },
  warning:  { icon: 'oklch(0.62 0.18 65)' },
  info:     { icon: 'oklch(0.35 0 0)' },
};

// ── Public API — uses module-level ref so there is no stale-closure bug ──

let _add: ((t: Omit<ToastItem, 'id' | 'exiting'>) => void) | null = null;

export function toast(type: ToastType, message: string) {
  _add?.({ type, message });
}

// ── Component ─────────────────────────────────────────────────

export function ToastContainer() {
  const [item, setItem] = useState<ToastItem | null>(null);
  const dismissRef = useRef<ReturnType<typeof setTimeout>>();
  const chainRef = useRef<ReturnType<typeof setTimeout>>();

  // Keep a ref to the latest setItem so the stable callback can always access it
  const setItemRef = useRef(setItem);
  setItemRef.current = setItem;

  const clearTimers = () => {
    if (dismissRef.current) { clearTimeout(dismissRef.current); dismissRef.current = undefined; }
    if (chainRef.current) { clearTimeout(chainRef.current); chainRef.current = undefined; }
  };

  // Stable callback — never changes, so _add is always the latest version
  // Track showing state in a ref to avoid stale-closure bugs
  const busyRef = useRef(false);

  const add = useCallback((t: Omit<ToastItem, 'id' | 'exiting'>) => {
    clearTimers();

    const show = () => {
      busyRef.current = true;
      const id = Math.random().toString(36).slice(2, 10);
      setItemRef.current({ ...t, id, exiting: false });
      dismissRef.current = setTimeout(() => {
        setItemRef.current(prev => prev ? { ...prev, exiting: true } : null);
        dismissRef.current = setTimeout(() => {
          busyRef.current = false;
          setItemRef.current(null);
        }, 220);
      }, 2200);
    };

    if (busyRef.current) {
      // A toast is currently visible — exit it first, then show the new one
      setItemRef.current(prev => prev ? { ...prev, exiting: true } : null);
      chainRef.current = setTimeout(show, 200);
    } else {
      show();
    }
  }, []); // stable — uses ref, never recreates

  useEffect(() => {
    _add = add;
    return () => { _add = null; clearTimers(); };
  }, [add]);

  if (!item) return null;

  const c = COLOR_MAP[item.type];
  const Icon = ICON_MAP[item.type];

  return (
    <div
      className="fixed left-1/2 -translate-x-1/2 flex justify-center z-[700] pointer-events-none"
      style={{ top: '62px' }}
    >
      <div
        className="pointer-events-auto flex items-center gap-2.5 px-4 py-2.5"
        style={{
          background: 'var(--surface)',
          borderRadius: '20px',
          boxShadow: '0 1px 4px oklch(0 0 0 / 0.06), 0 4px 16px oklch(0 0 0 / 0.06)',
          animation: item.exiting
            ? 'toastOut 200ms cubic-bezier(0.25, 0.1, 0.25, 1.0) forwards'
            : 'toastIn 300ms cubic-bezier(0.17, 0.67, 0.35, 1.3) both',
        }}
      >
        <Icon className="w-4 h-4 flex-shrink-0" style={{ color: c.icon }} />
        <span className="text-sm" style={{ color: "var(--text-primary)" }}>
          {item.message}
        </span>
      </div>
    </div>
  );
}
