import { shouldAutoCollapseSidebar, SIDEBAR_AUTO_COLLAPSE_WIDTH } from '@shared/constants';
import type { ProxyStatus } from '@shared/proxy';
import { type AppearanceConfig, defaultAppearanceConfig } from '@shared/theme';
import type { ReactElement } from 'react';
import { useEffect, useState } from 'react';

import { AppShell } from './components/AppShell';
import { PageCard } from './components/PageCard';
import { type PageId } from './navigation';
import { DailyPage } from './pages/DailyPage';
import { DownloadsPage } from './pages/DownloadsPage';
import { FavoritesPage } from './pages/FavoritesPage';
import { SearchPage } from './pages/SearchPage';
import { SettingsPage } from './pages/SettingsPage';
import { applyAppearanceToDocument } from './theme';

/** 07 DR-095：侧栏展开 / 收起状态在渲染层记忆，跨启动保留 */
const SIDEBAR_STORAGE_KEY = 'lepic.sidebar.collapsed';

function readSidebarCollapsed(): boolean {
  try {
    return window.localStorage.getItem(SIDEBAR_STORAGE_KEY) === 'true';
  } catch {
    // 存储不可用时按展开处理，不阻塞界面
    return false;
  }
}

function writeSidebarCollapsed(collapsed: boolean): void {
  try {
    window.localStorage.setItem(SIDEBAR_STORAGE_KEY, String(collapsed));
  } catch {
    // 记忆失败只影响下次启动的默认状态，不影响当前会话
  }
}

/**
 * 外壳（T-39 / DR-095）：侧栏五项 + 42px 标题栏 + 右侧白卡；
 * 页面保持挂载（仅切换 hidden），既保留首页与收藏状态，也让清除记录事件能即时刷新隐藏页面（T-22）。
 */
export function App(): ReactElement {
  const [page, setPage] = useState<PageId>('home');
  const [proxyAlert, setProxyAlert] = useState<string | null>(null);
  // DR-093：外观以 config.json 为准，启动读取一次；设置页切换时即时写入同样的根节点属性
  const [appearance, setAppearance] = useState<AppearanceConfig>(defaultAppearanceConfig);
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(
    () => readSidebarCollapsed() || shouldAutoCollapseSidebar(window.innerWidth)
  );

  useEffect(() => {
    applyAppearanceToDocument(appearance);
  }, [appearance]);

  // DR-095：进入窄窗口时自动收起一次；之后仍可用标题栏开关手动展开，不反复强制收起
  useEffect(() => {
    const query = window.matchMedia(`(max-width: ${SIDEBAR_AUTO_COLLAPSE_WIDTH - 1}px)`);
    const handleChange = (event: MediaQueryListEvent): void => {
      if (event.matches) setSidebarCollapsed(true);
    };
    query.addEventListener('change', handleChange);
    return () => {
      query.removeEventListener('change', handleChange);
    };
  }, []);

  useEffect(() => {
    let active = true;
    window.booru
      .getSettings()
      .then((result) => {
        if (active && result.ok) setAppearance(result.data.settings.appearance);
      })
      .catch(() => {
        // 外观读取失败时保持亮色默认，不阻塞界面
      });
    return () => {
      active = false;
    };
  }, []);

  // DR-039：代理不可用时主进程回退直连，这里只负责把原因显示出来
  useEffect(() => {
    let active = true;
    const applyStatus = (status: ProxyStatus): void => {
      if (!active) return;
      setProxyAlert(status.fallback ? (status.reason ?? '代理不可用，已回退直连') : null);
    };

    window.booru
      .getNetworkStatus()
      .then((result) => {
        if (result.ok) applyStatus(result.data);
      })
      .catch(() => {
        // 状态只用于提示，读取失败不阻塞界面
      });
    const unsubscribe = window.booru.onNetworkStatus(applyStatus);

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const toggleSidebar = (): void => {
    const next = !sidebarCollapsed;
    setSidebarCollapsed(next);
    writeSidebarCollapsed(next);
  };

  const alert =
    proxyAlert === null ? undefined : (
      <div className="app-network-alert" role="alert">
        <span>{proxyAlert}</span>
        <button
          type="button"
          className="app-network-alert__close"
          aria-label="关闭提示"
          onClick={() => {
            setProxyAlert(null);
          }}
        >
          ×
        </button>
      </div>
    );

  return (
    <AppShell
      activePage={page}
      collapsed={sidebarCollapsed}
      onNavigate={setPage}
      onToggleSidebar={toggleSidebar}
      alert={alert}
    >
      <PageCard hidden={page !== 'home'}>
        <SearchPage />
      </PageCard>
      <PageCard hidden={page !== 'daily'}>
        <DailyPage active={page === 'daily'} />
      </PageCard>
      <PageCard hidden={page !== 'favorites'}>
        <FavoritesPage />
      </PageCard>
      <PageCard hidden={page !== 'downloads'}>
        <DownloadsPage />
      </PageCard>
      <PageCard hidden={page !== 'settings'}>
        <SettingsPage />
      </PageCard>
    </AppShell>
  );
}
