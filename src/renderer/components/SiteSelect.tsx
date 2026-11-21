import type { AnySiteId } from '@shared/constants';
import { SITE_LABELS } from '@shared/sites';
import type { ChangeEvent, ReactElement } from 'react';

import styles from './SiteSelect.module.css';

export interface SiteSelectProps {
  site: AnySiteId;
  /** 只列出具备 `search` 能力的站点（02 §2.1） */
  sites: readonly AnySiteId[];
  /** 需要密钥但未配置的站点置灰，给出原因 */
  isDisabled(id: AnySiteId): boolean;
  disabledReason: string;
  onChange(site: AnySiteId): void;
}

/** 02 §2.1：工具栏第一项，站点下拉；白底浅描边圆角 */
export function SiteSelect({
  site,
  sites,
  isDisabled,
  disabledReason,
  onChange
}: SiteSelectProps): ReactElement {
  const allDisabled = sites.every((id) => isDisabled(id));
  return (
    <select
      className={styles.root}
      aria-label="选择站点"
      title={allDisabled ? disabledReason : undefined}
      value={site}
      onChange={(event: ChangeEvent<HTMLSelectElement>) => {
        const next = sites.find((id) => id === event.target.value);
        if (next !== undefined) onChange(next);
      }}
    >
      {sites.map((id) => {
        const blocked = isDisabled(id);
        return (
          <option key={id} value={id} disabled={blocked} title={blocked ? disabledReason : undefined}>
            {SITE_LABELS[id]}
          </option>
        );
      })}
    </select>
  );
}
