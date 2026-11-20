import type { AppearanceConfig } from '@shared/theme';

/**
 * 07 DR-093 / DR-102：把外观状态写到根节点，样式层通过 `data-theme` / `data-bg-preset` / `data-motion` 切换。
 * 只做 DOM 属性更新，不触发 React 重渲染。
 */
export function applyAppearanceToDocument(appearance: AppearanceConfig): void {
  const root = document.documentElement;
  root.dataset['theme'] = appearance.theme;
  root.dataset['bgPreset'] = appearance.background;
  root.dataset['motion'] = appearance.motion;
}
