import { Settings, Globe } from 'lucide-react';
import LangToggle from './LangToggle';
import ThemeToggle from './ThemeToggle';
import { useAppSettings } from '../appSettings';

export default function SettingsPanel() {
  const { lang, theme, setLang, setTheme, t } = useAppSettings();

  return (
    <div className="flex-1 flex flex-col min-h-0 animate-fade-in">
      <div className="flex items-center gap-2 mb-4 px-1">
        <Settings className="w-4 h-4" style={{ color: "var(--text-strong)" }} />
        <h2 className="text-sm font-semibold uppercase tracking-wider" style={{ color: "var(--text-secondary)", letterSpacing: '0.05em' }}>{t('settings.title')}</h2>
      </div>
      <div className="flex-1 overflow-y-auto min-h-0 space-y-4">
        <div className="rounded-[18px] p-5 animate-fade-in-up settings-card" style={{ animationDelay: '0ms', animationFillMode: 'both' }}>
          <p className="text-[10px] font-medium uppercase tracking-wider mb-4" style={{ color: "var(--text-muted)" }}>{t('settings.display')}</p>
          <LangToggle lang={lang} onToggle={setLang} />
          <p className="text-[10px] mt-3 leading-relaxed" style={{ color: "var(--text-muted)", lineHeight: '1.5' }}>{t('settings.languageHint')}</p>
        </div>
        <div className="rounded-[18px] p-5 animate-fade-in-up settings-card" style={{ animationDelay: '80ms', animationFillMode: 'both' }}>
          <p className="text-[10px] font-medium uppercase tracking-wider mb-4" style={{ color: "var(--text-muted)" }}>{t('settings.appearance')}</p>
          <ThemeToggle theme={theme} onToggle={setTheme} />
          <p className="text-[10px] mt-3 leading-relaxed" style={{ color: "var(--text-muted)", lineHeight: '1.5' }}>{t('settings.appearanceHint')}</p>
        </div>
        <div className="rounded-[18px] p-5 animate-fade-in-up settings-card" style={{ animationDelay: '160ms', animationFillMode: 'both' }}>
          <p className="text-[10px] font-medium uppercase tracking-wider mb-3" style={{ color: "var(--text-muted)" }}>{t('settings.about')}</p>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs"><span style={{ color: "var(--text-secondary)" }}>{t('settings.version')}</span><span className="font-medium ml-auto" style={{ color: "var(--text-primary)" }}>{t("致知 v1.0")}</span></div>
            <div className="flex items-center gap-2 text-xs"><Globe className="w-3 h-3 flex-shrink-0" style={{ color: "var(--text-muted)" }} /><span style={{ color: "var(--text-secondary)" }}>{t('settings.currentLanguage')}</span><span className="font-medium ml-auto" style={{ color: "var(--text-primary)" }}>{lang === 'zh' ? t('settings.zh') : 'English'}</span></div>
            <div className="flex items-center gap-2 text-xs"><span style={{ color: "var(--text-secondary)" }}>{t('settings.appearanceMode')}</span><span className="font-medium ml-auto" style={{ color: "var(--text-primary)" }}>{theme === 'light' ? t('settings.light') : t('settings.dark')}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
