/**
 * 07 DR-093：外观模型。亮色为默认主题；暗色 token 保留但界面不可选（「即将支持」）。
 * 背景提供两套底色预设，切换后写入 `config.json#appearance` 并持久保留。
 */
export const THEME_MODES = ['light', 'dark'] as const;

export type ThemeMode = (typeof THEME_MODES)[number];

export const BACKGROUND_PRESETS = ['design', 'neutral'] as const;

export type BackgroundPreset = (typeof BACKGROUND_PRESETS)[number];

/** 07 DR-102：动效档位；system 读取 `prefers-reduced-motion`，另两档为应用内覆盖 */
export const MOTION_MODES = ['system', 'reduced', 'full'] as const;

export type MotionMode = (typeof MOTION_MODES)[number];

export interface AppearanceConfig {
  theme: ThemeMode;
  background: BackgroundPreset;
  motion: MotionMode;
}

export const THEME_LABELS: Record<ThemeMode, string> = {
  light: '亮色',
  dark: '暗色'
};

export const BACKGROUND_LABELS: Record<BackgroundPreset, string> = {
  design: '设计稿（粉紫蓝）',
  neutral: '中性白灰'
};

export const MOTION_LABELS: Record<MotionMode, string> = {
  system: '跟随系统',
  reduced: '减少动态效果',
  full: '完整动效'
};

export function defaultAppearanceConfig(): AppearanceConfig {
  return { theme: 'light', background: 'design', motion: 'system' };
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

export function isThemeMode(value: unknown): value is ThemeMode {
  return typeof value === 'string' && (THEME_MODES as readonly string[]).includes(value);
}

export function isBackgroundPreset(value: unknown): value is BackgroundPreset {
  return typeof value === 'string' && (BACKGROUND_PRESETS as readonly string[]).includes(value);
}

export function isMotionMode(value: unknown): value is MotionMode {
  return typeof value === 'string' && (MOTION_MODES as readonly string[]).includes(value);
}

/** 缺失或非法字段按默认值逐项回落，不因单项损坏丢弃整组设置 */
export function parseAppearanceConfig(raw: unknown): AppearanceConfig {
  const record = isRecord(raw) ? raw : {};
  const defaults = defaultAppearanceConfig();
  return {
    theme: isThemeMode(record['theme']) ? record['theme'] : defaults.theme,
    background: isBackgroundPreset(record['background'])
      ? record['background']
      : defaults.background,
    motion: isMotionMode(record['motion']) ? record['motion'] : defaults.motion
  };
}
