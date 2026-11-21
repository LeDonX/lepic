import type { AnySiteId } from '@shared/constants';
import type { RankingKind, RankingPeriod } from '@shared/rankings';
import type { ReactElement, ReactNode } from 'react';

import styles from './HomeToolbar.module.css';
import { RankingTabs } from './RankingTabs';
import { SiteSelect } from './SiteSelect';
import { TimeControl } from './TimeControl';

export interface HomeToolbarProps {
  site: AnySiteId;
  sites: readonly AnySiteId[];
  isSiteDisabled(id: AnySiteId): boolean;
  siteDisabledReason: string;
  onSiteChange(site: AnySiteId): void;
  /** 第二项：标签搜索，由 SearchPage 注入 SearchBar */
  search: ReactNode;
  rankingKind: RankingKind;
  /** 无 `rankings` 能力的站点四项常显但禁用（02 §2.1） */
  rankingsEnabled: boolean;
  onRankingKindChange(kind: RankingKind): void;
  period: RankingPeriod;
  onPeriodChange(period: RankingPeriod): void;
}

/**
 * 02 §2.1 / DR-096：首页工具栏固定四项顺序——站点 → 搜索 → 榜单 → 时间。
 * 永远单行不换行；任何状态变化都不改变控件位置与顺序。
 */
export function HomeToolbar({
  site,
  sites,
  isSiteDisabled,
  siteDisabledReason,
  onSiteChange,
  search,
  rankingKind,
  rankingsEnabled,
  onRankingKindChange,
  period,
  onPeriodChange
}: HomeToolbarProps): ReactElement {
  return (
    <div className={styles.root}>
      <SiteSelect
        site={site}
        sites={sites}
        isDisabled={isSiteDisabled}
        disabledReason={siteDisabledReason}
        onChange={onSiteChange}
      />
      <div className={styles.search}>{search}</div>
      <RankingTabs kind={rankingKind} disabled={!rankingsEnabled} onChange={onRankingKindChange} />
      <TimeControl period={period} disabled={!rankingsEnabled || period.kind === 'popular'} onChange={onPeriodChange} />
    </div>
  );
}
