import { FileUp, Sparkles, FileText, MessageSquare, Link2, Cpu, Zap } from 'lucide-react';
import { useAppSettings } from '../appSettings';

export function EmptyStateUpload() {
  const { t } = useAppSettings();
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 animate-fade-in">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6" style={{ background: 'var(--surface-active)' }}>
        <FileUp className="w-8 h-8" style={{ color: "var(--text-strong)" }} />
      </div>
      <h3 className="text-lg font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
        {t('qa.noDocsTitle')}
      </h3>
      <p className="text-sm text-center max-w-xs" style={{ color: "var(--text-secondary)" }}>
        {t('qa.noDocsBody')}
      </p>
    </div>
  );
}

export function EmptyStateQA({ hasDocuments, onSampleClick, docCount }: { hasDocuments: boolean; onSampleClick?: (q: string) => void; docCount?: number }) {
  const { t } = useAppSettings();
  if (!hasDocuments) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center px-6 py-12 animate-fade-in" style={{ pointerEvents: 'none' }}>
        <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6" style={{ background: 'var(--surface-active)', animation: 'floatAway 6s ease-in-out infinite' }}>
          <Sparkles className="w-10 h-10" style={{ color: "var(--text-strong)" }} />
        </div>
        <h2 className="text-xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>
          {t("致知")}</h2>
        <p className="text-sm text-center max-w-sm mb-10" style={{ color: "var(--text-secondary)", lineHeight: '1.6' }}>
          {t("从采访整理稿、公开报告和背景资料中寻找线索；每条回答都保留原文来源，便于回到材料核验")}</p>

        <div className="grid gap-3 w-full max-w-sm">
          <div className="flex items-start gap-3 p-4 rounded-xl" style={{ backgroundColor: 'var(--bg)' }}>
            <FileText className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: "var(--text-strong)" }} />
            <div>
              <p className="text-sm font-medium mb-0.5" style={{ color: "var(--text-primary)" }}>{t('qa.feature.sources')}</p>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>{t('qa.feature.sourcesBody')}</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-4 rounded-xl" style={{ backgroundColor: 'var(--bg)' }}>
            <MessageSquare className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: "var(--text-strong)" }} />
            <div>
              <p className="text-sm font-medium mb-0.5" style={{ color: "var(--text-primary)" }}>{t('qa.feature.search')}</p>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>{t('qa.feature.searchBody')}</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-4 rounded-xl" style={{ backgroundColor: 'var(--bg)' }}>
            <Link2 className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: "var(--text-strong)" }} />
            <div>
              <p className="text-sm font-medium mb-0.5" style={{ color: "var(--text-primary)" }}>{t('qa.feature.traceable')}</p>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>{t('qa.feature.traceableBody')}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Has documents — system-ready welcome with status overview
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center px-6" style={{ pointerEvents: 'none' }}>
      <div className="relative mb-5 flex items-center justify-center" style={{ pointerEvents: 'none', width: '120px', height: '120px' }}>
        <div className="absolute rounded-full" style={{ width: '56px', height: '56px', background: 'transparent', boxShadow: '0 0 2px 1px oklch(0.55 0 0 / 0.08)', filter: 'blur(3px)', opacity: 0.35, animation: 'haloBreath 3.2s ease-in-out infinite' }} />
        <div className="absolute rounded-full" style={{ width: '54px', height: '54px', border: '2.5px solid oklch(0.55 0 0)', background: 'radial-gradient(circle, transparent 18px, oklch(0.60 0 0) 20px, oklch(0.42 0 0) 27px, oklch(0.25 0 0) 29px, transparent 31px)', boxShadow: '0 6px 20px oklch(0 0 0 / 0.14), inset 0 1px 0 oklch(1.0 0 0 / 0.18)', animation: 'ringBreathFull 3.2s ease-in-out infinite' }} />
        <div className="absolute rounded-full" style={{ width: '38px', height: '38px', border: '2px solid oklch(0.48 0 0)', animation: 'ringBreathFull 3.2s ease-in-out infinite 0.6s' }} />
        <div className="absolute rounded-full" style={{ width: '54px', height: '54px', background: 'radial-gradient(circle at 38% 30%, oklch(1.0 0 0 / 0.16) 0%, transparent 55%)', pointerEvents: 'none', animation: 'ringBreathFull 3.2s ease-in-out infinite' }} />
      </div>
      <h2 className="text-lg font-semibold mb-1.5" style={{ color: "var(--text-primary)" }}>{t('qa.readyTitle')}</h2>
      <p className="text-sm text-center mb-6 max-w-xs" style={{ color: "var(--text-secondary)", lineHeight: '1.5' }}>{t('qa.readyBody')}</p>
      <div className="w-full max-w-sm" style={{ pointerEvents: 'auto' }}>
        <div className="flex items-center justify-center w-full gap-3 px-4 py-2 rounded-full mb-8" style={{ backgroundColor: 'var(--surface-muted)' }}>
          <div className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: 'oklch(0.55 0.18 145)' }} /><FileText className="w-3 h-3 flex-shrink-0" style={{ color: "var(--text-muted)" }} /><span className="text-[11px] font-medium whitespace-nowrap" style={{ color: "var(--text-primary)" }}>{docCount ?? 0} {t('common.sources')}</span></div>
          <span className="text-[10px] flex-shrink-0" style={{ color: "var(--text-muted)" }}>|</span>
          <div className="flex items-center gap-1.5"><Cpu className="w-3 h-3 flex-shrink-0" style={{ color: "var(--text-muted)" }} /><span className="text-[11px] font-medium whitespace-nowrap" style={{ color: "var(--text-primary)" }}>Embedding</span></div>
          <span className="text-[10px] flex-shrink-0" style={{ color: "var(--text-muted)" }}>|</span>
          <div className="flex items-center gap-1.5"><Zap className="w-3 h-3 flex-shrink-0" style={{ color: "var(--text-strong)" }} /><span className="text-[11px] font-medium whitespace-nowrap" style={{ color: "var(--text-primary)" }}>{t('qa.streaming')}</span></div>
        </div>
      </div>
    </div>
  );
}
