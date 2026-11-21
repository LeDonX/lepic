import type { ReactElement, ReactNode } from 'react';

import styles from './PageCard.module.css';

interface PageCardProps {
  children: ReactNode;
  /** 页面常驻挂载，仅切换 hidden，保留各页状态（T-22） */
  hidden?: boolean;
}

/** 07 DR-095 / T-39：右侧唯一的不透明白卡，宽度随侧栏联动 */
export function PageCard({ children, hidden = false }: PageCardProps): ReactElement {
  return (
    <div className={styles.root} hidden={hidden}>
      {children}
    </div>
  );
}
