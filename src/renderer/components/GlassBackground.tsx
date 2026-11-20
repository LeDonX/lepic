import type { ReactElement } from 'react';

import styles from './GlassBackground.module.css';

/**
 * 07 DR-094：亮色玻璃背景 = 渐变底 + 3 个光斑。
 * 光斑参数照搬 fund-tracker 登录页：550 / 600 / 500px、blur 100px、opacity .7、16 / 20 / 14s，只动 transform。
 * `prefers-reduced-motion` 下由样式停用动画；该层不接收指针事件。
 */
export function GlassBackground(): ReactElement {
  return (
    <div className={styles.root} aria-hidden="true">
      <span className={styles.orb} data-orb="1" />
      <span className={styles.orb} data-orb="2" />
      <span className={styles.orb} data-orb="3" />
    </div>
  );
}
