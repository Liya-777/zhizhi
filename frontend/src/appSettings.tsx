import { uiTranslations } from './uiTranslations';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

export type Lang = 'zh' | 'en';
export type Theme = 'light' | 'dark';

type AppSettings = {
  lang: Lang;
  theme: Theme;
  setLang: (lang: Lang) => void;
  setTheme: (theme: Theme) => void;
  t: (key: string, values?: Record<string, string | number>) => string;
};

const translations: Record<string, { zh: string; en: string }> = {
  'brand.subtitle': { zh: '记者资料工作台', en: 'Reporter research workspace' },
  'nav.qa': { zh: '资料问答', en: 'Research Q&A' },
  'nav.kb': { zh: '资料库管理', en: 'Knowledge base' },
  'nav.browse': { zh: '资料浏览', en: 'Browse sources' },
  'nav.history': { zh: '历史会话', en: 'History' },
  'nav.bookmarks': { zh: '收藏', en: 'Bookmarks' },
  'nav.about': { zh: '关于系统', en: 'About' },
  'nav.system': { zh: '系统管理', en: 'System' },
  'nav.settings': { zh: '系统设置', en: 'Settings' },
  'sidebar.status': { zh: '系统状态', en: 'System status' },
  'sidebar.unloaded': { zh: '未加载', en: 'Not loaded' },
  'sidebar.documents': { zh: '资料库', en: 'Sources' },
  'sidebar.docsCount': { zh: '份资料', en: 'sources' },
  'header.messages': { zh: '条消息', en: 'messages' },
  'header.qaSubtitle': { zh: '从资料中查找线索并核验原文', en: 'Find leads and verify them against the source' },
  'header.kbSubtitle': { zh: '上传采访稿、报告或背景资料', en: 'Upload interview notes, reports, or background sources' },
  'header.browseEmpty': { zh: '暂无资料', en: 'No sources yet' },
  'header.browseSubtitle': { zh: '资料浏览', en: 'Browse your sources' },
  'header.bookmarksSubtitle': { zh: '你保存的问答收藏', en: 'Saved answers and questions' },
  'header.historySubtitle': { zh: '每会话最多 10 条消息', en: 'Up to 10 messages per session' },
  'header.aboutSubtitle': { zh: '系统信息与开发者', en: 'System information and developer' },
  'header.systemSubtitle': { zh: '服务状态与控制', en: 'Service status and controls' },
  'header.settingsSubtitle': { zh: '语言与偏好', en: 'Language and preferences' },
  'header.newChat': { zh: '新对话', en: 'New chat' },
  'header.user': { zh: '用户', en: 'User' },
  'header.admin': { zh: '管理员', en: 'Administrator' },
  'header.normalUser': { zh: '普通用户', en: 'User' },
  'header.logout': { zh: '退出登录', en: 'Log out' },
  'header.newChatTitle': { zh: '开始新对话？', en: 'Start a new chat?' },
  'header.newChatBody': { zh: '此操作将清除当前全部 {count} 条聊天记录，你可以在历史会话中找回。', en: 'This clears the current {count} messages. You can still find the chat in history.' },
  'common.cancel': { zh: '取消', en: 'Cancel' },
  'common.confirmClear': { zh: '清除并新建', en: 'Clear and start' },
  'common.sources': { zh: '份资料', en: 'sources' },
  'common.paragraph': { zh: '段落', en: 'paragraphs' },
  'login.username': { zh: '用户名', en: 'Username' },
  'login.password': { zh: '密码', en: 'Password' },
  'login.usernamePlaceholder': { zh: '请输入用户名', en: 'Enter username' },
  'login.passwordPlaceholder': { zh: '请输入密码', en: 'Enter password' },
  'login.submit': { zh: '登录', en: 'Sign in' },
  'login.invalid': { zh: '用户名或密码错误', en: 'Incorrect username or password' },
  'login.network': { zh: '网络连接失败，请检查后端服务是否启动', en: 'Network error. Please check that the backend is running.' },
  'login.tagline': { zh: '致知 · 资料检索与原文核验', en: 'ZhiZhi · Research and source verification' },
  'login.description': { zh: '面向学生记者的可追溯资料问答工具', en: 'Traceable research Q&A for student journalists' },
  'qa.readyTitle': { zh: '资料库就绪', en: 'Your sources are ready' },
  'qa.readyBody': { zh: '输入问题以检索资料；回答附带原文来源，请打开来源核对原始语境', en: 'Ask a question to search your sources. Open citations to verify the original context.' },
  'qa.noDocsTitle': { zh: '导入报道资料', en: 'Import reporting sources' },
  'qa.noDocsBody': { zh: '导入采访整理稿、公开报告和背景资料，支持 PDF、Word、TXT、Markdown 格式', en: 'Import interview notes, public reports, and background sources in PDF, Word, TXT, or Markdown.' },
  'qa.feature.sources': { zh: '多种报道资料', en: 'Multiple source types' },
  'qa.feature.sourcesBody': { zh: '支持采访整理稿、报告、背景资料等 PDF、Word、TXT、Markdown 文件', en: 'Interview notes, reports, and background sources in PDF, Word, TXT, or Markdown.' },
  'qa.feature.search': { zh: '问题驱动检索', en: 'Question-led search' },
  'qa.feature.searchBody': { zh: '用自然语言定位人物、时间、政策与争议，再回到原文确认上下文', en: 'Use natural language to locate people, dates, policies, and disputes, then verify the context.' },
  'qa.feature.traceable': { zh: '可追溯来源', en: 'Traceable citations' },
  'qa.feature.traceableBody': { zh: '每条回答附带来源段落；它提供检索线索，不替代记者的独立核验', en: 'Every answer keeps its source paragraphs as leads for independent verification.' },
  'qa.streaming': { zh: '流式', en: 'Streaming' },
  'qa.retry': { zh: '重试', en: 'Retry' },
  'qa.answerFailed': { zh: '回答失败', en: 'Answer failed' },
  'input.noDocs': { zh: '请先导入资料', en: 'Import sources first' },
  'input.example': { zh: '例如：谁提出了这项建议？(Enter 发送)', en: 'Example: Who proposed this? (Enter to send)' },
  'input.mock': { zh: '从已导入资料中查找线索… (Enter 发送)', en: 'Find leads in imported sources… (Enter to send)' },
  'input.ask': { zh: '提出需要核验的问题… (Enter 发送)', en: 'Ask a question to verify… (Enter to send)' },
  'input.answering': { zh: 'AI 正在回答… (Esc 或 点击停止)', en: 'AI is answering… (Esc or click stop)' },
  'input.stop': { zh: '停止生成', en: 'Stop generating' },
  'input.send': { zh: '发送 (Enter)', en: 'Send (Enter)' },
  'settings.title': { zh: '系统设置', en: 'Settings' },
  'settings.display': { zh: '显示', en: 'Display' },
  'settings.language': { zh: '界面语言', en: 'Interface language' },
  'settings.languageHint': { zh: '切换界面语言将立即生效。当前仅影响界面显示语言，不影响文档内容或 AI 回答语言。', en: 'The interface language changes immediately. Document content and AI answers keep their original language.' },
  'settings.appearance': { zh: '外观', en: 'Appearance' },
  'settings.appearanceHint': { zh: '深色模式会应用到整个工作台，并在刷新后保留。', en: 'Dark mode applies to the entire workspace and is remembered after refresh.' },
  'settings.about': { zh: '关于', en: 'About' },
  'settings.version': { zh: '系统版本', en: 'Version' },
  'settings.currentLanguage': { zh: '当前语言', en: 'Language' },
  'settings.appearanceMode': { zh: '外观模式', en: 'Appearance' },
  'settings.zh': { zh: '简体中文', en: 'Simplified Chinese' },
  'settings.light': { zh: '浅色', en: 'Light' },
  'settings.dark': { zh: '深色', en: 'Dark' },
  'settings.darkAria': { zh: '切换到深色模式', en: 'Switch to dark mode' },
  'settings.lightAria': { zh: '切换到浅色模式', en: 'Switch to light mode' },
  'doc.kb': { zh: '资料库', en: 'Sources' },
  'doc.upload': { zh: '导入资料', en: 'Import sources' },
  'doc.empty': { zh: '暂无资料', en: 'No sources yet' },
  'doc.emptyBody': { zh: '请在资料库管理中上传采访稿、报告或背景资料', en: 'Upload interview notes, reports, or background sources in Knowledge base.' },
  'doc.deleted': { zh: '文档已删除', en: 'Document deleted' },
  'doc.browse': { zh: '资料浏览', en: 'Browse sources' },
  'doc.previewOpen': { zh: '展开资料预览', en: 'Expand source preview' },
  'doc.previewClose': { zh: '收起资料预览', en: 'Collapse source preview' },
  'doc.section': { zh: '段落', en: 'Paragraph' },
  'about.title': { zh: '关于系统', en: 'About' },
  'about.systemInfo': { zh: '系统信息', en: 'System information' },
  'about.tagline': { zh: '检索资料线索 · 回到原文核验', en: 'Find leads · verify the source' },
  'about.running': { zh: '运行中', en: 'Running' },
  'about.starting': { zh: '启动中…', en: 'Starting…' },
  'about.developer': { zh: '开发者信息', en: 'Developer' },
  'about.author': { zh: '项目作者', en: 'Author' },
  'about.wechat': { zh: 'WeChat 二维码', en: 'WeChat QR code' },
  'bookmarks.empty': { zh: '暂无收藏', en: 'No bookmarks yet' },
  'bookmarks.hint': { zh: '在 AI 回答卡片右下角点击 ☆ 即可收藏', en: 'Click ☆ on an answer card to save it' },
  'bookmarks.question': { zh: '问题', en: 'Question' },
  'bookmarks.answer': { zh: 'AI 回答', en: 'AI answer' },
  'bookmarks.source': { zh: '来源：', en: 'Source: ' },
  'bookmarks.deleted': { zh: '收藏已删除', en: 'Bookmark deleted' },
  'history.empty': { zh: '暂无历史会话', en: 'No chat history yet' },
  'history.hint': { zh: '开始对话后会自动记录，每个对话最多 10 条消息', en: 'Chats are saved automatically, up to 10 messages per session' },
  'history.collapse': { zh: '收起会话', en: 'Collapse session' },
  'history.expand': { zh: '展开会话', en: 'Expand session' },
  'history.messages': { zh: '条消息', en: 'messages' },
  'history.rounds': { zh: '轮对话', en: 'turns' },
  'history.restore': { zh: '恢复对话', en: 'Restore chat' },
  'history.user': { zh: '用户', en: 'User' },
  'history.deleted': { zh: '会话已删除', en: 'Session deleted' },
  'qa.timeout': { zh: '回答生成超时，请重试', en: 'The answer timed out. Please try again.' },
  'qa.networkError': { zh: '网络连接异常，请重试', en: 'Network connection failed. Please try again.' },
};

const LANG_KEY = 'rag-lang';
const THEME_KEY = 'rag-theme';

function readLang(): Lang {
  try { const v = localStorage.getItem(LANG_KEY); if (v === 'en') return 'en'; } catch { /* ignore */ }
  return 'zh';
}

function readTheme(): Theme {
  try { const v = localStorage.getItem(THEME_KEY); if (v === 'dark') return 'dark'; } catch { /* ignore */ }
  return 'light';
}

function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#15181c' : '#f5f5f5');
}

function translate(lang: Lang, key: string, values?: Record<string, string | number>): string {
  const text = translations[key]?.[lang] ?? (lang === 'en' ? uiTranslations[key] : key) ?? key;
  return text.replace(/\{(\w+)\}/g, (placeholder, name: string) => String(values?.[name] ?? placeholder));
}

// For network callbacks and module-level error handlers, read the latest preference.
export function translateUi(key: string, values?: Record<string, string | number>) {
  return translate(readLang(), key, values);
}

const SettingsContext = createContext<AppSettings | null>(null);

export function AppSettingsProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(readLang);
  const [theme, setThemeState] = useState<Theme>(readTheme);

  const setLang = (next: Lang) => {
    setLangState(next);
    try { localStorage.setItem(LANG_KEY, next); } catch { /* ignore */ }
    if (typeof document !== 'undefined') document.documentElement.lang = next === 'zh' ? 'zh-CN' : 'en';
  };

  const setTheme = (next: Theme) => {
    setThemeState(next);
    applyTheme(next);
    try { localStorage.setItem(THEME_KEY, next); } catch { /* ignore */ }
  };

  useEffect(() => {
    if (typeof document !== 'undefined') document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
    document.title = lang === 'zh' ? '致知｜可追溯资料问答' : 'ZhiZhi | Traceable Research Q&A';
  }, [lang]);

  useEffect(() => applyTheme(theme), [theme]);

  useEffect(() => {
    const syncPreferences = (event: StorageEvent) => {
      if (event.key === LANG_KEY || event.key === null) setLangState(readLang());
      if (event.key === THEME_KEY || event.key === null) setThemeState(readTheme());
    };
    window.addEventListener('storage', syncPreferences);
    return () => window.removeEventListener('storage', syncPreferences);
  }, []);

  const value = useMemo(() => ({
    lang, theme, setLang, setTheme,
    t: (key: string, values?: Record<string, string | number>) => translate(lang, key, values),
  }), [lang, theme]);

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useAppSettings() {
  const context = useContext(SettingsContext);
  if (!context) throw new Error('useAppSettings must be used inside AppSettingsProvider');
  return context;
}
