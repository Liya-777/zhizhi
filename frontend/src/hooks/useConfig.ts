import { useState, useCallback, useEffect, useRef } from 'react';
import type { ConfigState } from '../types';
import { useApi } from './useApi';
import { toast } from '../components/Toast';
import { translateUi } from '../appSettings';

export function useConfig() {
  const api = useApi();
  const apiRef = useRef(api);
  apiRef.current = api;

  const [config, setConfig] = useState<ConfigState | null>(null);
  const [modeSwitching, setModeSwitching] = useState(false);
  const [configError, setConfigError] = useState<string | null>(null);

  const loadConfig = useCallback(async () => {
    setConfigError(null);
    const cfg = await apiRef.current.getConfig();
    if (cfg) setConfig(cfg);
    else setConfigError(translateUi('无法加载配置，请检查网络后刷新页面'));
  }, []);

  useEffect(() => { loadConfig(); }, [loadConfig]);

  const toggleMode = useCallback(async () => {
    setModeSwitching(true);
    setConfigError(null);

    const currentCfg = config ?? await apiRef.current.getConfig();
    if (!currentCfg) {
      setConfigError(translateUi('无法加载配置，请刷新页面后重试'));
      setModeSwitching(false);
      return;
    }

    setConfig(currentCfg);
    const result = await apiRef.current.setMockMode(!currentCfg.mock_llm);
    if (result) {
      setConfig(prev => prev ? { ...prev, mock_llm: result.mock_llm } : prev);
      toast('info', translateUi('已切换到 {mode} 模式', { mode: translateUi(result.mock_llm ? 'Mock 本地' : 'AI 检索') }));
    } else {
      setConfigError(translateUi('切换 RAG 模式失败，请检查网络后重试'));
    }
    setModeSwitching(false);
  }, [config]);

  return { config, configError, modeSwitching, toggleMode, loadConfig };
}
