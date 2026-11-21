import { RANKING_KINDS, RANKING_LABELS, type RankingKind } from '@shared/rankings';
import type { ReactElement } from 'react';

import styles from './RankingTabs.module.css';

export interface RankingTabsProps {
  kind: RankingKind;
  /** 站点没有 `rankings` 能力时四项常显但全部禁用（02 §2.1） */
  disabled: boolean;
  onChange(kind: RankingKind): void;
}

/** 02 §2.1：工具栏第三项，热门 / 日榜 / 周榜 / 月榜分段 */
export function RankingTabs({ kind, disabled, onChange }: RankingTabsProps): ReactElement {
  return (
    <div className={styles.root} role="group" aria-label="榜单类型">
      {RANKING_KINDS.map((value) => (
        <button
          key={value}
          type="button"
          className={styles.item}
          aria-pressed={kind === value}
          disabled={disabled}
          onClick={() => {
            onChange(value);
          }}
        >
          {RANKING_LABELS[value]}
        </button>
      ))}
    </div>
  );
}
