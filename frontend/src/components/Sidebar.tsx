import { useEffect, useState } from 'react';
import { MessageSquare, Database, Cpu, Zap, HardDrive, BookOpen, Bookmark, Clock, Info, Terminal, Settings } from 'lucide-react';
import ModeToggle from './ModeToggle';
import type { ConfigState, HealthResponse } from '../types';
import { useApi } from '../hooks/useApi';
import { useAppSettings } from '../appSettings';

interface NavItem {
  id: string;
  label: string;
  icon: typeof MessageSquare;
}

// 问答 — 独立在上
const QA_ITEM: NavItem = { id: 'qa', label: '资料问答', icon: MessageSquare };
// 资料库 + 工具 — 放在一起
const KB_ITEMS: NavItem[] = [
  { id: 'kb', label: '资料库管理', icon: Database },
  { id: 'browse', label: '资料浏览', icon: BookOpen },
  { id: 'history', label: '历史会话', icon: Clock },
  { id: 'bookmarks', label: '收藏', icon: Bookmark },
  { id: 'about', label: '关于系统', icon: Info },
  { id: 'system', label: '系统管理', icon: Terminal },
  { id: 'settings', label: '系统设置', icon: Settings },
];

type ViewType = 'qa' | 'kb' | 'browse' | 'bookmarks' | 'history' | 'about' | 'system' | 'settings';

interface Props {
  activeView: ViewType;
  onNavigate: (view: ViewType) => void;
  config: ConfigState | null;
  mockMode: boolean;
  configError?: string | null;
  role?: string;
  modeSwitching: boolean;
  onToggleMode: () => void;
}

const formatModel = (name: string) => name.replace('BAAI/', '');

export default function Sidebar({ activeView, onNavigate, config, mockMode, configError, modeSwitching, onToggleMode, role }: Props) {
  const { t } = useAppSettings();
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const api = useApi();

  useEffect(() => {
    api.getHealth().then(h => { if (h) setHealth(h); });
    const interval = setInterval(() => { api.getHealth().then(h => { if (h) setHealth(h); }); }, 30000);
    return () => clearInterval(interval);
  }, []);

  const renderButton = (item: NavItem) => {
    const isActive = activeView === item.id;
    const Icon = item.icon;
    const translated = ({
      qa: t('nav.qa'), kb: t('nav.kb'), browse: t('nav.browse'), history: t('nav.history'),
      bookmarks: t('nav.bookmarks'), about: t('nav.about'), system: t('nav.system'), settings: t('nav.settings'),
    } as Record<string, string>)[item.id] || item.label;
    return (
      <button key={item.id} onClick={() => onNavigate(item.id as ViewType)}
        aria-label={translated} aria-current={isActive ? 'page' : undefined}
        className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-[10px] transition-all duration-200 text-left"
        style={{ height: '44px', backgroundColor: isActive ? 'var(--surface-active)' : 'transparent', color: isActive ? "var(--text-primary)" : "var(--text-secondary)" }}
        onMouseEnter={e => { if (!isActive) { e.currentTarget.style.backgroundColor = 'var(--surface)'; e.currentTarget.style.color = "var(--text-primary)"; }}}
        onMouseLeave={e => { if (!isActive) { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = "var(--text-secondary)"; }}}
      >
        <Icon className="flex-shrink-0" style={{ width: '18px', height: '18px', color: isActive ? "var(--text-strong)" : "var(--text-muted)" }} />
        <span className={`text-sm ${isActive ? 'font-medium' : 'font-normal'}`}>{translated}</span>
      </button>
    );
  };

  return (
    <aside
      className="flex flex-col flex-shrink-0 h-screen sticky top-0 material-thick"
      style={{ width: '240px', borderRight: '0.5px solid var(--border)' }}
    >
      {/* Brand */}
      <div className="flex items-center gap-3 px-4 py-4">
        <img src="/assets/logo.png" alt={t("致知")} className="w-20 h-20 rounded-2xl flex-shrink-0 object-cover" />
        <div>
          <h1 className="text-lg font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>{t("致知")}</h1>
          <p className="text-[10px] mt-0.5" style={{ color: "var(--text-muted)" }}>{t('brand.subtitle')}</p>
        </div>
      </div>

      <div className="mx-4" style={{ borderTop: '1px solid var(--border)' }} />

      {/* 问答 — 独立在上 */}
      <nav className="px-3 py-4 space-y-1">
        {renderButton(QA_ITEM)}
      </nav>

      <div className="mx-4" style={{ borderTop: '1px solid var(--border)' }} />

      {/* 知识库 + 工具 — 放在一起 */}
      <nav className="px-3 py-4 space-y-1">
        {KB_ITEMS.filter(item => (item.id !== 'kb' && item.id !== 'system') || role === 'admin').map(renderButton)}
      </nav>

      {/* Spacer */}
      <div className="flex-1" />

      {/* System section */}
      <div className="px-4 pb-3 space-y-2.5">
        <p className="text-[10px] font-medium uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>{t('sidebar.status')}</p>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-[11px]">
            <Cpu className="w-3 h-3 flex-shrink-0" style={{ color: health?.embedding_loaded ? 'oklch(0.55 0.18 145)' : 'oklch(0.62 0.18 65)' }} />
            <span style={{ color: "var(--text-muted)" }}>Embedding</span>
            <span className="font-medium ml-auto truncate" style={{ color: "var(--text-primary)" }}>{health?.embedding_loaded ? formatModel(health.embedding_model) : t('sidebar.unloaded')}</span>
          </div>
          {health?.embedding_error && (
            <p className="text-[10px] leading-tight px-1" style={{ color: "var(--text-danger)" }} title={health.embedding_error}>
              ⚠ {health.embedding_error}
            </p>
          )}
          <div className="flex items-center gap-2 text-[11px]">
            <Zap className="w-3 h-3 flex-shrink-0" style={{ color: mockMode ? 'oklch(0.62 0.18 65)' : "var(--text-strong)" }} />
            <span style={{ color: "var(--text-muted)" }}>LLM</span>
            <span className="font-medium ml-auto truncate" style={{ color: "var(--text-primary)" }}>{mockMode ? 'Mock Local' : health?.llm_model || '—'}</span>
          </div>
          <div className="flex items-center gap-2 text-[11px]">
            <HardDrive className="w-3 h-3 flex-shrink-0" style={{ color: "var(--text-secondary)" }} />
            <span style={{ color: "var(--text-muted)" }}>{t('sidebar.documents')}</span>
            <span className="font-medium ml-auto" style={{ color: "var(--text-primary)" }}>{config?.documents_count ?? 0} {t('sidebar.docsCount')}</span>
          </div>
        </div>
      </div>

      <div className="mx-4" style={{ borderTop: '1px solid var(--border)' }} />

      <div className="px-4 py-3">
        <ModeToggle mockMode={mockMode} switching={modeSwitching} onToggle={onToggleMode} />
        {configError && (
          <p className="text-[10px] mt-1.5 px-1 leading-tight" style={{ color: "var(--text-danger)" }}>
            ⚠ {configError}
          </p>
        )}
      </div>
    </aside>
  );
}
