import { useAppSettings } from '../appSettings';
import { Component } from 'react';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children: React.ReactNode;
}

interface State {
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.error) {
      return <ErrorFallback />;
    }
    return this.props.children;
  }
}

function ErrorFallback() {
  const { t } = useAppSettings();
  return (
        <div
          className="h-screen flex items-center justify-center px-6"
          style={{ backgroundColor: 'var(--bg)' }}
        >
          <div className="text-center animate-fade-in-up" style={{ maxWidth: '360px' }}>
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-5"
              style={{ backgroundColor: 'oklch(0.52 0.22 21 / 0.08)' }}
            >
              <AlertTriangle className="w-6 h-6" style={{ color: "var(--text-danger)" }} />
            </div>
            <h2 className="text-lg font-bold mb-2" style={{ color: "var(--text-primary)" }}>
              {t('出现了意外错误')}
            </h2>
            <p className="text-sm mb-6" style={{ color: "var(--text-secondary)", lineHeight: '1.5' }}>
              {t('请尝试刷新页面。如果问题持续出现，可以检查后端服务是否正常运行。')}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2.5 rounded-[10px] text-sm font-semibold transition-all duration-200"
              style={{
                background: 'linear-gradient(160deg, oklch(0.48 0 0) 0%, oklch(0.35 0 0) 40%, oklch(0.22 0 0) 100%)',
                color: 'white',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              {t('刷新页面')}
            </button>
          </div>
        </div>
      );
}
