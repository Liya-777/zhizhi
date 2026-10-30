import { useState, useEffect } from 'react';
import { User, Lock, Loader2 } from 'lucide-react';
import BrandRing from './BrandRing';
import { useAppSettings } from '../appSettings';

interface Props {
  onLogin: (username: string, password: string) => Promise<boolean>;
  transitioning?: boolean;
}

export default function LoginPage({ onLogin, transitioning }: Props) {
  const { t } = useAppSettings();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);

  useEffect(() => { setError(''); }, [username, password]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!username.trim() || !password.trim()) return;
    setLoading(true); setError('');
    try {
      const ok = await onLogin(username, password);
      setLoading(false);
      if (!ok) { setError(t('login.invalid')); setShake(true); setTimeout(() => setShake(false), 400); }
    } catch {
      setLoading(false);
      setError(t('login.network'));
    }
  };

  return (
    <div
      className={`h-screen flex items-center justify-center px-6 ${transitioning ? 'opacity-0 scale-[0.98]' : 'opacity-100'} ${transitioning ? 'pointer-events-none' : ''}`}
      style={{
        backgroundColor: 'var(--bg)',
        filter: transitioning ? 'blur(2px)' : 'none',
        transition: 'opacity 350ms cubic-bezier(0.17, 0.17, 0, 1.0), transform 350ms cubic-bezier(0.17, 0.17, 0, 1.0), filter 350ms cubic-bezier(0.17, 0.17, 0, 1.0)',
        backgroundImage: 'radial-gradient(circle at 50% 38%, var(--surface-active) 0%, var(--bg) 70%)',
      }}
    >
      <div className="animate-fade-in" style={{ width: '340px', maxWidth: '100%' }}>
        {/* Brand — breathing metal ring */}
        <div className="text-center mb-8">
          <BrandRing />
          <h1 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>{t('致知')}</h1>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>{t('login.description')}</p>
        </div>

        {/* Login card */}
        <div className="rounded-[18px] p-6" style={{ backgroundColor: 'var(--surface)', border: '0.5px solid var(--border)', boxShadow: '0 1px 3px oklch(0 0 0 / 0.04)' }}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>{t('login.username')}</label>
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-[10px]" style={{ backgroundColor: 'var(--surface-muted)', border: '0.5px solid var(--border)' }}>
                <User className="w-4 h-4 flex-shrink-0" style={{ color: "var(--text-muted)" }} />
                <input type="text" value={username} onChange={e => setUsername(e.target.value)} placeholder={t('login.usernamePlaceholder')} autoFocus aria-label={t('login.username')} className="flex-1 text-sm outline-none" style={{ backgroundColor: 'var(--surface-muted)', color: "var(--text-primary)" }} onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>{t('login.password')}</label>
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-[10px]" style={{ backgroundColor: 'var(--surface-muted)', border: '0.5px solid var(--border)' }}>
                <Lock className="w-4 h-4 flex-shrink-0" style={{ color: "var(--text-muted)" }} />
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder={t('login.passwordPlaceholder')} aria-label={t('login.password')} className="flex-1 text-sm outline-none" style={{ backgroundColor: 'var(--surface-muted)', color: "var(--text-primary)" }} onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
              </div>
            </div>
            {error && <p className="text-xs" style={{ color: "var(--text-danger)", animation: shake ? 'shake 0.3s ease-in-out' : 'none' }}>{error}</p>}
            <button type="submit" disabled={loading || !username.trim() || !password.trim()} aria-label={t('login.submit')} className="w-full py-2.5 rounded-[10px] text-sm font-semibold transition-all duration-200"
              style={{ background: loading || !username.trim() || !password.trim() ? 'var(--border)' : 'linear-gradient(160deg, oklch(0.48 0 0) 0%, oklch(0.35 0 0) 40%, oklch(0.22 0 0) 100%)', color: 'white', border: 'none', cursor: loading ? 'wait' : 'pointer' }}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : t('login.submit')}
            </button>
          </form>
        </div>

        <p className="text-center text-[10px] mt-5" style={{ color: "var(--text-muted)" }}>{t('login.tagline')}</p>
      </div>
    </div>
  );
}
