import { DOWNLOAD_VARIANTS } from '@shared/downloads';
import { AppErrorException, createAppError } from '@shared/errors';
import { PROXY_MODES } from '@shared/proxy';
import type { Settings } from '@shared/settings';
import { BACKGROUND_PRESETS, defaultAppearanceConfig, MOTION_MODES, THEME_MODES } from '@shared/theme';
import { z } from 'zod';

/** 05 §5 / 07 DR-040：`settings:set` 入参覆盖全部设置组，逐字段 zod 校验 */
const settingsSchema = z.object({
  hostmap: z.object({
    enabled: z.boolean(),
    entries: z.array(
      z.object({
        host: z.string(),
        ip: z.string()
      })
    )
  }),
  content: z.object({
    allowExplicit: z.boolean(),
    // DR-056：全局标签黑名单，逐项语义校验交给 validateSettings
    blacklist: z.array(z.string())
  }),
  downloads: z.object({
    concurrency: z.number(),
    destinationDir: z.string(),
    template: z.string(),
    // DR-051：批量下载默认格式
    format: z.enum(DOWNLOAD_VARIANTS)
  }),
  network: z.object({
    proxy: z.object({
      mode: z.enum(PROXY_MODES),
      host: z.string(),
      port: z.number()
    })
  }),
  // DR-071：旧客户端可能不带该组，缺失时按未配置处理
  providers: z
    .object({
      wallhavenApiKey: z.string().optional()
    })
    .optional(),
  // DR-093：旧配置可能不带外观组，缺失时回落亮色 + 设计稿底色
  appearance: z
    .object({
      theme: z.enum(THEME_MODES),
      background: z.enum(BACKGROUND_PRESETS),
      // DR-102：旧外观配置可能不含动效档位
      motion: z.enum(MOTION_MODES).optional()
    })
    .optional()
});

export function parseSettingsInput(raw: unknown): Settings {
  const parsed = settingsSchema.safeParse(raw);
  if (!parsed.success) {
    throw new AppErrorException(
      createAppError('CONFIG', '设置参数无效', {
        detail: parsed.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('; ')
      })
    );
  }
  return {
    ...parsed.data,
    providers: {
      wallhavenApiKey: parsed.data.providers?.wallhavenApiKey ?? ''
    },
    appearance: parsed.data.appearance
      ? { ...parsed.data.appearance, motion: parsed.data.appearance.motion ?? 'system' }
      : defaultAppearanceConfig()
  };
}
