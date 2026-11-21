import type { ReactElement } from 'react';

import styles from './TitleBar.module.css';

interface TitleBarProps {
  collapsed: boolean;
  onToggleSidebar: () => void;
}

/**
 * 07 DR-095 / 02 §14.1：42px 标题栏 = 拖拽区 + 侧栏开关。
 * 窗口按钮仍由系统标题栏提供，本层不承载业务操作。
 */
export function TitleBar({ collapsed, onToggleSidebar }: TitleBarProps): ReactElement {
  const label = collapsed ? '展开侧栏' : '收起侧栏';
  return (
    <header className={styles.root}>
      <div className={styles.drag} aria-hidden="true" />
      <button
        type="button"
        className={styles.toggle}
        aria-label={label}
        aria-expanded={!collapsed}
        title={label}
        onClick={onToggleSidebar}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          aria-hidden="true"
        >
          <path d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
    </header>
  );
}
