import { useAppSettings } from '../appSettings';
import { useState, useEffect, useCallback, useRef } from 'react';
import { Cpu, Zap, HardDrive, RefreshCw, Clock, Loader2, Terminal, AlertTriangle, StopCircle } from 'lucide-react';
import { useApi } from '../hooks/useApi';
import { toast } from './Toast';

interface SystemStatus {
  pid: number;
  status: string;
  uptime: string;
  uptime_seconds: number;
  port: number;
  embedding_loaded: boolean;
  embedding_model: string;
  embedding_error?: string | null;
  llm_mode: string;
  llm_model: string;
  documents_count: number;
  log_tail: string[];
}

export default function SystemPanel() {
  const { t } = useAppSettings();
  const { getSystemStatus, restartServer, stopServer } = useApi();
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [restarting, setRestarting] = useState(false);
  const [stopping, setStopping] = useState(false);
  const [showRestartConfirm, setShowRestartConfirm] = useState(false);
  const [showStopConfirm, setShowStopConfirm] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  const load = useCallback(async () => {
    const s = await getSystemStatus();
    if (s) setStatus(s);
    setLoading(false);
  }, [getSystemStatus]);

  useEffect(() => { load(); }, [load]);

  // Auto-refresh every 5 seconds
  useEffect(() => {
    timerRef.current = setInterval(load, 5000);
    return () => clearInterval(timerRef.current);
  }, [load]);

  const handleRestart = async () => {
    setShowRestartConfirm(false);
    setRestarting(true);
    const r = await restartServer();
    if (r) {
      toast('info', t("服务重启中，页面即将自动刷新…"));
      const poll = setInterval(async () => {
        try {
          const res = await fetch('/api/health');
          if (res.ok) {
            clearInterval(poll);
            window.location.reload();
          }
        } catch { /* still down */ }
      }, 1000);
      setTimeout(() => { clearInterval(poll); setRestarting(false); }, 30000);
    } else {
      setRestarting(false);
    }
  };

  const handleStop = async () => {
    setShowStopConfirm(false);
    setStopping(true);
    const r = await stopServer();
    if (r) {
      // Poll until server goes down, then show a stopped state
      const poll = setInterval(async () => {
        try {
          await fetch('/api/health');
        } catch {
          clearInterval(poll);
          toast('warning', t("服务已关闭。运行 bash scripts/server.sh start 重新启动"));
          setStopping(false);
        }
      }, 1000);
      setTimeout(() => { clearInterval(poll); setStopping(false); }, 10000);
    } else {
      setStopping(false);
    }
  };

  const formatUptime = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4 px-1">
        <Terminal className="w-4 h-4" style={{ color: "var(--text-strong)" }} />
        <h2 className="text-sm font-semibold uppercase tracking-wider" style={{ color: "var(--text-secondary)", letterSpacing: '0.05em' }}>
          {t("系统管理")}</h2>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin" style={{ color: "var(--text-strong)" }} />
        </div>
      ) : !status ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Terminal className="w-10 h-10 mb-4" style={{ color: "var(--text-muted)" }} />
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{t("无法获取服务状态")}</p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto min-h-0 space-y-4">
          {/* Status cards */}
          <div className="grid grid-cols-2 gap-3">
            {/* Server */}
            <div className="rounded-xl p-4" style={{ backgroundColor: 'var(--surface)', border: '0.5px solid var(--border)' }}>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'oklch(0.55 0.18 145)' }} />
                <span className="text-[10px] font-medium uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>{t("运行状态")}</span>
              </div>
              <p className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>{t("运行中")}</p>
              <p className="text-[11px] mt-0.5" style={{ color: "var(--text-secondary)" }}>
                PID {status.pid} · {t('端口')} {status.port}
              </p>
            </div>

            {/* Uptime */}
            <div className="rounded-xl p-4" style={{ backgroundColor: 'var(--surface)', border: '0.5px solid var(--border)' }}>
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-3 h-3" style={{ color: "var(--text-secondary)" }} />
                <span className="text-[10px] font-medium uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>{t("运行时长")}</span>
              </div>
              <p className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>{formatUptime(status.uptime_seconds)}</p>
              <p className="text-[11px] mt-0.5" style={{ color: "var(--text-secondary)" }}>{status.uptime}</p>
            </div>
          </div>

          {/* System info */}
          <div className="rounded-xl p-4 space-y-3" style={{ backgroundColor: 'var(--surface)', border: '0.5px solid var(--border)' }}>
            <p className="text-[10px] font-medium uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>{t("系统信息")}</p>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs">
                <Cpu className="w-3 h-3 flex-shrink-0" style={{ color: status.embedding_loaded ? 'oklch(0.55 0.18 145)' : 'oklch(0.62 0.18 65)' }} />
                <span style={{ color: "var(--text-secondary)" }}>{t("Embedding 模型")}</span>
                <span className="font-medium ml-auto" style={{ color: "var(--text-primary)" }}>{status.embedding_model.replace('BAAI/', '')}</span>
                <span className="text-[10px]" style={{ color: status.embedding_loaded ? 'oklch(0.55 0.18 145)' : 'oklch(0.62 0.18 65)' }}>
                  {status.embedding_loaded ? t("已加载") : t("未加载")}
                </span>
              </div>
              {status.embedding_error && (
                <div className="text-[10px] leading-tight" style={{ color: "var(--text-danger)" }} title={status.embedding_error}>
                  ⚠ {status.embedding_error}
                </div>
              )}
              <div className="flex items-center gap-2 text-xs">
                <Zap className="w-3 h-3 flex-shrink-0" style={{ color: "var(--text-secondary)" }} />
                <span style={{ color: "var(--text-secondary)" }}>{t("LLM 模型")}</span>
                <span className="font-medium ml-auto" style={{ color: "var(--text-primary)" }}>{status.llm_mode === 'mock' ? t("Mock 本地") : status.llm_model}</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <HardDrive className="w-3 h-3 flex-shrink-0" style={{ color: "var(--text-secondary)" }} />
                <span style={{ color: "var(--text-secondary)" }}>{t("资料库")}</span>
                <span className="font-medium ml-auto" style={{ color: "var(--text-primary)" }}>{status.documents_count} {t("份资料")}</span>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="rounded-xl p-4" style={{ backgroundColor: 'var(--surface)', border: '0.5px solid var(--border)' }}>
            <p className="text-[10px] font-medium uppercase tracking-wider mb-3" style={{ color: "var(--text-muted)" }}>{t("服务控制")}</p>
            <div className="flex items-center gap-3">
              {/* Restart */}
              <button
                onClick={() => setShowRestartConfirm(true)}
                disabled={restarting || stopping}
                aria-label={t("重启服务")}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200"
                style={{
                  backgroundColor: (restarting || stopping) ? 'var(--surface-active)' : 'oklch(0.35 0 0)',
                  color: 'white',
                  border: 'none',
                  cursor: (restarting || stopping) ? 'wait' : 'pointer',
                }}
              >
                {restarting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                {restarting ? t("重启中…") : t("重启服务")}
              </button>

              {/* Stop */}
              <button
                onClick={() => setShowStopConfirm(true)}
                disabled={restarting || stopping}
                aria-label={t("关闭服务")}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200"
                style={{
                  backgroundColor: stopping ? 'var(--surface-active)' : 'transparent',
                  color: stopping ? "var(--text-muted)" : "var(--text-danger)",
                  border: stopping ? '1px solid oklch(0.55 0 0)' : '1px solid oklch(0.52 0.22 21)',
                  cursor: stopping ? 'wait' : 'pointer',
                }}
              >
                {stopping ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <StopCircle className="w-4 h-4" />
                )}
                {stopping ? t("关闭中…") : t("关闭服务")}
              </button>
            </div>
            {restarting && (
              <p className="text-[10px] mt-2" style={{ color: "var(--text-muted)" }}>
                {t("服务即将重启，页面将在服务恢复后自动刷新")}</p>
            )}
            {stopping && (
              <p className="text-[10px] mt-2" style={{ color: "var(--text-danger)" }}>
                {t("服务即将关闭，如需重新启动请在终端运行：bash scripts/server.sh start")}</p>
            )}
          </div>

          {/* Logs */}
          {status.log_tail.length > 0 && (
            <div className="rounded-xl p-4" style={{ backgroundColor: 'var(--surface-muted)', border: '0.5px solid var(--border)' }}>
              <p className="text-[10px] font-medium uppercase tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>{t("最近日志")}</p>
              <div className="rounded-lg p-3 overflow-x-auto" style={{ backgroundColor: 'oklch(0.20 0 0)', maxHeight: '200px', overflowY: 'auto' }}>
                {status.log_tail.map((line, i) => (
                  <div key={i} className="text-[10px] leading-relaxed font-mono" style={{ color: "var(--text-muted)", whiteSpace: 'nowrap' }}>
                    {line}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Restart confirmation modal */}
      {/* Restart confirmation modal */}
      {showRestartConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in"
          style={{ backgroundColor: 'oklch(0 0 0 / 0.2)' }}
          onClick={() => setShowRestartConfirm(false)}
        >
          <div
            className="rounded-2xl p-6 animate-scale-in"
            style={{
              backgroundColor: 'var(--surface)',
              boxShadow: '0 20px 60px oklch(0 0 0 / 0.12)',
              border: '0.5px solid var(--border)',
              maxWidth: '400px',
              width: '90%',
            }}
            onClick={e => e.stopPropagation()}
          >
            <div
              className="w-11 h-11 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ backgroundColor: 'oklch(0.62 0.18 65 / 0.10)' }}
            >
              <AlertTriangle className="w-5 h-5" style={{ color: 'oklch(0.62 0.18 65)' }} />
            </div>
            <h2 className="text-base font-semibold text-center mb-2" style={{ color: "var(--text-primary)" }}>{t("确认重启服务？")}</h2>
            <p className="text-sm text-center mb-4" style={{ color: "var(--text-secondary)", lineHeight: '1.5' }}>
              {t("重启期间服务将短暂不可用（约 3-5 秒），")}<br />{t("当前所有用户的操作将被中断。")}</p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowRestartConfirm(false)}
                aria-label={t("取消重启")}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                style={{ backgroundColor: 'var(--surface-muted)', color: "var(--text-primary)", border: 'none', cursor: 'pointer' }}
              >
                {t("取消")}</button>
              <button
                onClick={handleRestart}
                aria-label={t("确认重启服务")}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                style={{ backgroundColor: 'oklch(0.35 0 0)', color: 'white', border: 'none', cursor: 'pointer' }}
              >
                {t("确认重启")}</button>
            </div>
          </div>
        </div>
      )}

      {/* Stop confirmation modal */}
      {showStopConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in"
          style={{ backgroundColor: 'oklch(0 0 0 / 0.2)' }}
          onClick={() => setShowStopConfirm(false)}
        >
          <div
            className="rounded-2xl p-6 animate-scale-in"
            style={{
              backgroundColor: 'var(--surface)',
              boxShadow: '0 20px 60px oklch(0 0 0 / 0.12)',
              border: '0.5px solid var(--border)',
              maxWidth: '400px',
              width: '90%',
            }}
            onClick={e => e.stopPropagation()}
          >
            <div
              className="w-11 h-11 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ backgroundColor: 'oklch(0.52 0.22 21 / 0.10)' }}
            >
              <StopCircle className="w-5 h-5" style={{ color: "var(--text-danger)" }} />
            </div>
            <h2 className="text-base font-semibold text-center mb-2" style={{ color: "var(--text-primary)" }}>{t("确认关闭服务？")}</h2>
            <p className="text-sm text-center mb-4" style={{ color: "var(--text-secondary)", lineHeight: '1.5' }}>
              {t("关闭后所有用户将")}<strong style={{ color: "var(--text-danger)" }}>{t("无法访问")}</strong>{t("系统。")}<br />
              {t("需要手动在终端重新启动。")}</p>
            <div className="rounded-lg p-3 mb-4" style={{ backgroundColor: 'var(--surface-muted)', border: '0.5px solid var(--border)' }}>
              <p className="text-[11px] leading-relaxed" style={{ color: "var(--text-body)", fontFamily: 'SF Mono, Menlo, monospace' }}>
                $ bash scripts/server.sh start
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowStopConfirm(false)}
                aria-label={t("取消关闭")}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                style={{ backgroundColor: 'var(--surface-muted)', color: "var(--text-primary)", border: 'none', cursor: 'pointer' }}
              >
                {t("取消")}</button>
              <button
                onClick={handleStop}
                aria-label={t("确认关闭服务")}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                style={{ backgroundColor: 'oklch(0.52 0.22 21)', color: 'white', border: 'none', cursor: 'pointer' }}
              >
                {t("确认关闭")}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
