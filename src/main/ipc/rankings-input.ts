import { ALL_SITE_IDS } from '@shared/constants';
import { AppErrorException, createAppError } from '@shared/errors';
import type { PostsRankingsInput } from '@shared/ipc-contract';
import { compareRankingDates } from '@shared/rankings';
import { z } from 'zod';

/** 05 §5：IPC 入参一律 zod 校验，失败返回 CONFIG */
const rankingDateSchema = z.object({
  year: z.number().int().min(2005).max(2100),
  month: z.number().int().min(1).max(12),
  day: z.number().int().min(1).max(31)
});

/** DR-096：周榜为日期区间，开始不得晚于结束（02 §2.1） */
const rankingRangeSchema = z
  .object({ from: rankingDateSchema, to: rankingDateSchema })
  .refine((value) => compareRankingDates(value.from, value.to) <= 0, {
    message: '周榜开始日期不得晚于结束日期'
  });

const rankingPeriodSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('popular') }),
  z.object({ kind: z.literal('day'), date: rankingDateSchema }),
  z.object({ kind: z.literal('week'), range: rankingRangeSchema }),
  z.object({ kind: z.literal('month'), date: rankingDateSchema })
]);

const rankingsInputSchema = z.object({
  site: z.enum(ALL_SITE_IDS),
  period: rankingPeriodSchema,
  page: z.number().int().min(1).optional()
});

export function parseRankingsInput(raw: unknown): PostsRankingsInput {
  const parsed = rankingsInputSchema.safeParse(raw);
  if (!parsed.success) {
    throw new AppErrorException(
      createAppError('CONFIG', '榜单参数无效', {
        detail: parsed.error.issues.map((issue) => issue.message).join('; ')
      })
    );
  }
  return parsed.data;
}
