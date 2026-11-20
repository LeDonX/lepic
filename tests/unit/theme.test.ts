import { parseSettingsInput } from '@main/ipc/settings-input';
import { defaultSettings, parseSettings } from '@shared/settings';
import {
  BACKGROUND_PRESETS,
  defaultAppearanceConfig,
  MOTION_MODES,
  parseAppearanceConfig,
  THEME_MODES
} from '@shared/theme';
import { describe, expect, it } from 'vitest';

describe('外观模型（T-38 / DR-093 / DR-102）', () => {
  it('默认亮色主题 + 设计稿底色 + 跟随系统动效', () => {
    expect(defaultAppearanceConfig()).toEqual({
      theme: 'light',
      background: 'design',
      motion: 'system'
    });
  });

  it('主题、底色与动效逐项回落，不因单项损坏丢弃整组', () => {
    expect(parseAppearanceConfig(undefined)).toEqual(defaultAppearanceConfig());
    expect(parseAppearanceConfig('not-an-object')).toEqual(defaultAppearanceConfig());
    expect(parseAppearanceConfig({ theme: 'blue' })).toEqual({
      theme: 'light',
      background: 'design',
      motion: 'system'
    });
    expect(parseAppearanceConfig({ theme: 'dark', background: 'unknown' })).toEqual({
      theme: 'dark',
      background: 'design',
      motion: 'system'
    });
    expect(parseAppearanceConfig({ background: 'neutral', motion: 'reduced' })).toEqual({
      theme: 'light',
      background: 'neutral',
      motion: 'reduced'
    });
    expect(parseAppearanceConfig({ motion: 'fast' }).motion).toBe('system');
  });

  it('设置模型缺失外观组时回落默认（含旧配置缺 motion）', () => {
    expect(parseSettings({}).appearance).toEqual(defaultAppearanceConfig());
    expect(parseSettings({ appearance: { background: 'neutral' } }).appearance).toEqual({
      theme: 'light',
      background: 'neutral',
      motion: 'system'
    });
  });

  it('settings:set 入参缺少外观组时补齐，非法枚举被 zod 拒绝', () => {
    const input = defaultSettings();
    expect(parseSettingsInput({ ...input, appearance: undefined }).appearance).toEqual(
      defaultAppearanceConfig()
    );
    expect(
      parseSettingsInput({
        ...input,
        appearance: { theme: 'light', background: 'design', motion: undefined }
      }).appearance.motion
    ).toBe('system');
    expect(() =>
      parseSettingsInput({ ...input, appearance: { theme: 'dark', background: 'unknown' } })
    ).toThrow();
    expect(() =>
      parseSettingsInput({
        ...input,
        appearance: { theme: 'light', background: 'design', motion: 'turbo' }
      })
    ).toThrow();
  });

  it('主题、底色与动效枚举固定，避免持久化值错位', () => {
    expect(THEME_MODES).toEqual(['light', 'dark']);
    expect(BACKGROUND_PRESETS).toEqual(['design', 'neutral']);
    expect(MOTION_MODES).toEqual(['system', 'reduced', 'full']);
  });
});
