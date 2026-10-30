import { useEffect, useState } from 'react';
import { Info, Cpu, Circle, User, Phone, Mail, MessageCircle } from 'lucide-react';
import type { HealthResponse } from '../types';
import { useApi } from '../hooks/useApi';
import { useAppSettings } from '../appSettings';

export default function AboutPanel() {
  const { t } = useAppSettings();
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const api = useApi();

  useEffect(() => {
    api.getHealth().then(h => { if (h) setHealth(h); });
  }, []);

  const isRunning = health?.status === 'ok' && health?.embedding_loaded;

  return (
    <div className="flex-1 flex flex-col min-h-0 animate-fade-in">
      <div className="flex items-center gap-2 mb-6 px-1">
        <Info className="w-4 h-4" style={{ color: "var(--text-strong)" }} />
        <h2 className="text-sm font-semibold uppercase tracking-wider" style={{ color: "var(--text-secondary)", letterSpacing: '0.05em' }}>{t('about.title')}</h2>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0 space-y-6">
        {/* System Identity */}
        <section className="animate-fade-in-up" style={{ animationDelay: '0ms', animationFillMode: 'both' }}>
          <p className="text-[11px] font-medium uppercase tracking-wider mb-3" style={{ color: "var(--text-muted)" }}>{t('about.systemInfo')}</p>
          <div className="rounded-2xl overflow-hidden" style={{ border: '0.5px solid var(--border)' }}>
            {/* Hero */}
            <div className="px-5 py-6 text-center" style={{ background: 'linear-gradient(160deg, oklch(0.48 0 0) 0%, oklch(0.35 0 0) 40%, oklch(0.22 0 0) 100%)' }}>
              <img src="/assets/logo.png" alt={t("致知")} className="w-24 h-24 rounded-2xl mx-auto mb-4 object-cover" />
              <h1 className="text-xl font-bold mb-1" style={{ color: 'white' }}>{t("致知")}</h1>
              <p className="text-sm" style={{ color: 'oklch(1.0 0 0 / 0.6)' }}>{t('about.tagline')}</p>
            </div>

            {/* Status rows */}
            <div style={{ backgroundColor: 'var(--surface)' }}>
              <div className="flex items-center justify-between px-5 py-3" style={{ borderBottom: '0.5px solid var(--border)' }}>
                <span className="text-sm" style={{ color: "var(--text-primary)" }}>{t("系统版本")}</span>
                <span className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>v1.0.0-beta</span>
              </div>
              <div className="flex items-center justify-between px-5 py-3" style={{ borderBottom: '0.5px solid var(--border)' }}>
                <span className="text-sm" style={{ color: "var(--text-primary)" }}>{t("运行状态")}</span>
                <div className="flex items-center gap-1.5">
                  <Circle className="w-2 h-2" fill={isRunning ? 'oklch(0.55 0.18 145)' : 'oklch(0.62 0.18 65)'} stroke="none" />
                  <span className="text-sm font-medium" style={{ color: isRunning ? 'oklch(0.55 0.18 145)' : 'oklch(0.62 0.18 65)' }}>
                    {isRunning ? t('about.running') : t('about.starting')}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between px-5 py-3" style={{ borderBottom: '0.5px solid var(--border)' }}>
                <span className="text-sm" style={{ color: "var(--text-primary)" }}>LLM</span>
                <span className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
                  {health?.llm_model || '—'}
                </span>
              </div>
              <div className="flex items-center justify-between px-5 py-3" style={{ borderBottom: '0.5px solid var(--border)' }}>
                <span className="text-sm" style={{ color: "var(--text-primary)" }}>{t("资料库")}</span>
                <span className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
                  {health?.documents_count ?? 0} {t("份资料")}</span>
              </div>
              <div className="flex items-center justify-between px-5 py-3">
                <span className="text-sm" style={{ color: "var(--text-primary)" }}>Embedding</span>
                <div className="flex items-center gap-2">
                  {health?.embedding_error && (
                    <span className="text-[10px] cursor-help" style={{ color: "var(--text-danger)" }} title={health.embedding_error}>⚠</span>
                  )}
                  <span className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
                    {health?.embedding_model?.replace('BAAI/', '') || '—'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Developer Info */}
        <section className="animate-fade-in-up" style={{ animationDelay: '80ms', animationFillMode: 'both' }}>
          <p className="text-[11px] font-medium uppercase tracking-wider mb-3" style={{ color: "var(--text-muted)" }}>{t('about.developer')}</p>
          <div className="rounded-2xl overflow-hidden" style={{ border: '0.5px solid var(--border)', backgroundColor: 'var(--surface)' }}>
            <div className="flex items-center gap-3 px-5 py-4" style={{ borderBottom: '0.5px solid var(--border)' }}>
              <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(160deg, oklch(0.48 0 0) 0%, oklch(0.35 0 0) 40%, oklch(0.22 0 0) 100%)' }}>
                <User className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Liu Yan</p>
                <p className="text-[11px]" style={{ color: "var(--text-secondary)" }}>{t('about.author')}</p>
              </div>
            </div>
            <div className="px-5 py-3 space-y-2.5">
              <div className="flex items-center gap-3">
                <Phone className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "var(--text-muted)" }} />
                <span className="text-sm" style={{ color: "var(--text-body)" }}>13381545096</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "var(--text-muted)" }} />
                <span className="text-sm" style={{ color: "var(--text-body)" }}>1324528040@qq.com</span>
              </div>
              <div className="flex items-center gap-3">
                <MessageCircle className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "var(--text-muted)" }} />
                <span className="text-sm" style={{ color: "var(--text-body)" }}>{t('about.wechat')}</span>
              </div>
              {/* QR */}
              <div className="mt-2 flex justify-center">
                <img src="/assets/vxQRcode.png" alt="WeChat QR" className="w-36 h-36 rounded-xl object-cover" style={{ border: '1px solid var(--border)' }}
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <p className="text-center text-[10px] pb-6" style={{ color: "var(--text-muted)" }}>
          Design by zzy
        </p>
      </div>
    </div>
  );
}
