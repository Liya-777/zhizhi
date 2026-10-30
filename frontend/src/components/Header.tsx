import { useState, useRef, useEffect, useCallback } from 'react';
import { MessageSquare, Database, Clock, BookOpen, Bookmark, Info, Plus, User, LogOut, ChevronDown, Settings } from 'lucide-react';
import { useAppSettings } from '../appSettings';

type ViewType = 'qa' | 'kb' | 'browse' | 'bookmarks' | 'history' | 'about' | 'system' | 'settings';

interface Props {
  activeView: ViewType;
  docCount: number;
  msgCount: number;
  username?: string;
  role?: string;
  onNewChat?: () => void;
  onLogout?: () => void;
}

const VIEW_ICONS: Record<ViewType, typeof MessageSquare> = {
  qa: MessageSquare, kb: Database, browse: BookOpen, bookmarks: Bookmark,
  history: Clock, about: Info, system: Info, settings: Settings,
};

export default function Header({ activeView, docCount, msgCount, username, role, onNewChat, onLogout }: Props) {
  const { t } = useAppSettings();
  const [showConfirm, setShowConfirm] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [menuPos, setMenuPos] = useState<{ top: number; right: number } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const labels: Record<ViewType, string> = {
    qa: t('nav.qa'), kb: t('nav.kb'), browse: t('nav.browse'), bookmarks: t('nav.bookmarks'),
    history: t('nav.history'), about: t('nav.about'), system: t('nav.system'), settings: t('nav.settings'),
  };
  const subtitle = activeView === 'qa'
    ? (msgCount > 0 ? `${msgCount} ${t('header.messages')}` : t('header.qaSubtitle'))
    : activeView === 'kb'
      ? (docCount > 0 ? `${docCount} ${t('common.sources')}` : t('header.kbSubtitle'))
      : activeView === 'browse'
        ? (docCount > 0 ? `${docCount} ${t('common.sources')}` : t('header.browseEmpty'))
        : t(`header.${activeView}Subtitle`);
  const Icon = VIEW_ICONS[activeView];
  const isQA = activeView === 'qa';

  // Close menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
        setMenuPos(null);
      }
    };
    if (showUserMenu) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showUserMenu]);

  // Recalculate position on scroll/resize
  useEffect(() => {
    if (!showUserMenu || !triggerRef.current) return;
    const recalc = () => {
      const rect = triggerRef.current!.getBoundingClientRect();
      setMenuPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
    };
    recalc();
    window.addEventListener('scroll', recalc, true);
    window.addEventListener('resize', recalc);
    return () => {
      window.removeEventListener('scroll', recalc, true);
      window.removeEventListener('resize', recalc);
    };
  }, [showUserMenu]);

  const handleToggleMenu = useCallback(() => {
    setShowUserMenu(prev => !prev);
  }, []);

  const handleLogoutClick = () => {
    setShowUserMenu(false);
    setMenuPos(null);
    onLogout?.();
  };

  const displayName = username || t('header.user');
  const displayRole = role === 'admin' ? t('header.admin') : t('header.normalUser');

  return (
    <>
      <header
        className="border-b material-regular"
        style={{ borderColor: 'var(--border)' }}
      >
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Icon className="w-4 h-4" style={{ color: "var(--text-strong)" }} />
            <h1 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              {labels[activeView]}
            </h1>
            <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>
              {subtitle}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {isQA && msgCount > 0 && onNewChat && (
              <button onClick={() => setShowConfirm(true)} aria-label={t('header.newChat')}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200"
                style={{ color: "var(--text-strong)", border: '1px solid oklch(0.35 0 0 / 0.15)', backgroundColor: 'transparent' }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = 'oklch(0.35 0 0 / 0.06)'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <Plus className="w-3 h-3" />{t('header.newChat')}
              </button>
            )}

            {/* User area — trigger only, dropdown rendered at fixed position */}
            <div className="relative">
              <button
                ref={triggerRef}
                onClick={handleToggleMenu}
                className="flex items-center gap-2 pl-3 pr-2 py-1.5 rounded-lg transition-all duration-200"
                style={{ backgroundColor: showUserMenu ? 'var(--surface-muted)' : 'transparent', border: 'none', cursor: 'pointer' }}
                onMouseEnter={e => { if (!showUserMenu) e.currentTarget.style.backgroundColor = 'var(--bg)'; }}
                onMouseLeave={e => { if (!showUserMenu) e.currentTarget.style.backgroundColor = 'transparent'; }}
                aria-label={t('header.user')}
                aria-expanded={showUserMenu}
              >
                {/* Avatar */}
                <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(160deg, oklch(0.48 0 0) 0%, oklch(0.35 0 0) 40%, oklch(0.22 0 0) 100%)' }}>
                  <User className="w-3.5 h-3.5 text-white" />
                </div>
                <span className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>{displayName}</span>
                <ChevronDown className="w-3 h-3 transition-transform duration-200" style={{ transform: showUserMenu ? 'rotate(180deg)' : 'none', color: "var(--text-muted)" }} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Dropdown — fixed positioning escapes overflow:hidden parents */}
      {showUserMenu && menuPos && (
        <div
          ref={menuRef}
          className="fixed rounded-xl animate-scale-in"
          style={{
            top: `${menuPos.top}px`,
            right: `${menuPos.right}px`,
            width: '192px',
            backgroundColor: 'var(--surface)',
            boxShadow: '0 8px 32px oklch(0 0 0 / 0.12)',
            border: '0.5px solid var(--border)',
            zIndex: 500,
          }}
        >
          {/* User info header */}
          <div className="px-4 py-3" style={{ borderBottom: '0.5px solid var(--border)' }}>
            <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{displayName}</p>
            <p className="text-[10px] mt-0.5" style={{ color: "var(--text-muted)" }}>{displayRole}</p>
          </div>
          {/* Menu items */}
          <div className="py-1">
            <button
              className="w-full flex items-center gap-2.5 px-4 py-2 text-left text-sm transition-colors"
              style={{ color: "var(--text-primary)", border: 'none', background: 'transparent', cursor: 'pointer' }}
              onClick={() => { setShowUserMenu(false); setMenuPos(null); }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg)'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <User className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
              {displayRole} · {displayName}
            </button>
            <button
              className="w-full flex items-center gap-2.5 px-4 py-2 text-left text-sm transition-colors"
              style={{ color: "var(--text-primary)", border: 'none', background: 'transparent', cursor: 'pointer' }}
              onClick={handleLogoutClick}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg)'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <LogOut className="w-4 h-4" style={{ color: "var(--text-danger)" }} />
              {t('header.logout')}
            </button>
          </div>
        </div>
      )}

      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in" style={{ backgroundColor: 'oklch(0 0 0 / 0.2)' }}
          onClick={() => setShowConfirm(false)}>
          <div className="rounded-2xl p-6 animate-scale-in" style={{ backgroundColor: 'var(--surface)', boxShadow: '0 20px 60px oklch(0 0 0 / 0.12)', border: '0.5px solid var(--border)', maxWidth: '360px', width: '90%' }}
            onClick={e => e.stopPropagation()}>
            <h2 className="text-base font-semibold mb-2" style={{ color: "var(--text-primary)" }}>{t('header.newChatTitle')}</h2>
            <p className="text-sm mb-5" style={{ color: "var(--text-secondary)", lineHeight: '1.5' }}>{t('header.newChatBody', { count: msgCount })}</p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowConfirm(false)} aria-label={t("取消新建对话")} className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              style={{ backgroundColor: 'var(--surface-muted)', color: "var(--text-primary)", border: 'none', cursor: 'pointer' }}>{t('common.cancel')}</button>
              <button onClick={() => { setShowConfirm(false); onNewChat?.(); }}
              aria-label={t("确认清除当前对话并新建")}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              style={{ backgroundColor: 'oklch(0.52 0.22 21)', color: 'white', border: 'none', cursor: 'pointer' }}>{t('common.confirmClear')}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
