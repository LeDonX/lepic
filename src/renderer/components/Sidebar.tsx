import type { ReactElement } from 'react';

import { type PageId, VISIBLE_NAV_ITEMS } from '../navigation';
import styles from './Sidebar.module.css';

interface SidebarProps {
  activePage: PageId;
  collapsed: boolean;
  onNavigate: (page: PageId) => void;
}

/** 07 DR-095：五项菜单直接位于玻璃背景上，无独立卡片；收起后只显示图标 */
export function Sidebar({ activePage, collapsed, onNavigate }: SidebarProps): ReactElement {
  return (
    <aside className={styles.root} data-collapsed={collapsed}>
      <div className={styles.brand}>
        <span className={styles.appIcon} aria-hidden="true">
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="3" width="18" height="18" rx="4" />
            <circle cx="9" cy="9" r="1.6" fill="currentColor" stroke="none" />
            <path d="m5 19 4.5-5 3 3 2.5-2.5 4 4.5" />
          </svg>
        </span>
      </div>
      <nav className={styles.items} aria-label="主导航">
        {VISIBLE_NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={styles.item}
            aria-current={activePage === item.id ? 'page' : undefined}
            title={collapsed ? item.label : undefined}
            onClick={() => {
              onNavigate(item.id);
            }}
          >
            <span className={styles.icon} aria-hidden="true">
              <NavIcon id={item.id} />
            </span>
            <span className={styles.label}>{item.label}</span>
          </button>
        ))}
      </nav>
    </aside>
  );
}

/** 线性图标统一 22px（设计稿建议 Home / Calendar / Heart / Download / Settings） */
function NavIcon({ id }: { id: PageId }): ReactElement {
  switch (id) {
    case 'home':
      return (
        <svg {...iconProps}>
          <path d="m3 10.5 9-7.5 9 7.5" />
          <path d="M5 9.5V21h14V9.5" />
        </svg>
      );
    case 'daily':
      return (
        <svg {...iconProps}>
          <rect x="3" y="5" width="18" height="16" rx="2" />
          <path d="M8 3v4M16 3v4M3 10h18" />
        </svg>
      );
    case 'favorites':
      return (
        <svg {...iconProps}>
          <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l7 7Z" />
        </svg>
      );
    case 'downloads':
      return (
        <svg {...iconProps}>
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <path d="m7 10 5 5 5-5M12 15V3" />
        </svg>
      );
    case 'settings':
      return (
        <svg {...iconProps}>
          <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2Z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      );
  }
}

const iconProps = {
  width: 22,
  height: 22,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round'
} as const;
