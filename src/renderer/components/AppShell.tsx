import type { ReactElement, ReactNode } from 'react';

import { type PageId } from '../navigation';
import styles from './AppShell.module.css';
import { GlassBackground } from './GlassBackground';
import { Sidebar } from './Sidebar';
import { TitleBar } from './TitleBar';

interface AppShellProps {
  activePage: PageId;
  collapsed: boolean;
  onNavigate: (page: PageId) => void;
  onToggleSidebar: () => void;
  /** 全局提示（代理回退等），位于标题栏与白卡之间 */
  alert?: ReactNode;
  children: ReactNode;
}

/**
 * 07 DR-095 / T-39：玻璃背景 + 标题栏 + 侧栏 + 右侧白卡容器。
 * 侧栏展开 / 收起由 flex 布局驱动，右侧内容同步改变宽度；本层不发业务请求。
 */
export function AppShell({
  activePage,
  collapsed,
  onNavigate,
  onToggleSidebar,
  alert,
  children
}: AppShellProps): ReactElement {
  return (
    <>
      <GlassBackground />
      <div className={styles.shell}>
        <TitleBar collapsed={collapsed} onToggleSidebar={onToggleSidebar} />
        {alert !== undefined ? <div className={styles.alert}>{alert}</div> : null}
        <div className={styles.body}>
          <Sidebar activePage={activePage} collapsed={collapsed} onNavigate={onNavigate} />
          <div className={styles.content}>{children}</div>
        </div>
      </div>
    </>
  );
}
