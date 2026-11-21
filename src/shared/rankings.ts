/**
 * 02 §2.1 / §4 / 03 §5.1：榜单类型与请求路径。
 * DR-041：日期用可序列化的 `{year, month, day}`，避免 `Date` 跨 IPC（05 §5）。
 * DR-096：期榜入参统一为 `RankingPeriod`，周榜改为用户选择的日期区间（ISO 周辅助保留）。
 */
export const RANKING_KINDS = ['popular', 'day', 'week', 'month'] as const;
export type RankingKind = (typeof RANKING_KINDS)[number];

export interface RankingDate {
  year: number;
  month: number;
  day: number;
}

/** 周榜日期范围，`from` 不得晚于 `to`（02 §2.1） */
export interface RankingRange {
  from: RankingDate;
  to: RankingDate;
}

/** 期榜请求参数：热门无日期，日/月为单日/月份，周为区间 */
export type RankingPeriod =
  | { kind: 'popular' }
  | { kind: 'day'; date: RankingDate }
  | { kind: 'week'; range: RankingRange }
  | { kind: 'month'; date: RankingDate };

export const RANKING_LABELS: Record<RankingKind, string> = {
  popular: '热门',
  day: '日榜',
  week: '周榜',
  month: '月榜'
};

/** 06 §2：limit 最大 100 */
export const RANKING_PAGE_LIMIT = 100;

/** 02 §4：时间控件只对日/周/月榜可点，热门时禁用 */
export function rankingNeedsDate(kind: RankingKind): boolean {
  return kind !== 'popular';
}

/** DR-008 / DR-041：popular_recent 固定 40 条且忽略 limit/page，只能取第 1 页 */
export function rankingSupportsPaging(kind: RankingKind): boolean {
  return kind !== 'popular';
}

const pad2 = (value: number): string => String(value).padStart(2, '0');

function dateToNumber(date: RankingDate): number {
  return date.year * 10000 + date.month * 100 + date.day;
}

/** 日历日期比较：前者早返回负数，相同返回 0，后者早返回正数 */
export function compareRankingDates(a: RankingDate, b: RankingDate): number {
  return dateToNumber(a) - dateToNumber(b);
}

/** 期榜实际请求的日期区间：日=单日、周=所选范围、月=当月 1 日至月末 */
function periodRange(period: RankingPeriod): RankingRange {
  switch (period.kind) {
    case 'day':
      return { from: period.date, to: period.date };
    case 'week':
      return period.range;
    case 'month': {
      const lastDay = new Date(period.date.year, period.date.month, 0).getDate();
      return {
        from: { year: period.date.year, month: period.date.month, day: 1 },
        to: { year: period.date.year, month: period.date.month, day: lastDay }
      };
    }
    case 'popular':
      throw new Error('热门榜单没有日期区间');
  }
}

/**
 * 03 §5.1 的端点映射。`popular` 固定 `period=1d`（02 §4 无周期选择）。
 * DR-092：`popular_by_day/week/month` 实测固定返回 40 条且忽略 `limit`/`page`，
 * 期榜改用 `/post.json` 的 `date:` 区间 + `order:score`，既能返回当期全部作品，也能继续翻页。
 */
export function buildRankingPath(
  period: RankingPeriod,
  page = 1,
  limit = RANKING_PAGE_LIMIT
): string {
  if (period.kind === 'popular') return '/post/popular_recent.json?period=1d';

  const { from, to } = periodRange(period);
  const fromText = formatRankingDateInput(from);
  const toText = formatRankingDateInput(to);
  const dateExpr = fromText === toText ? `date:${fromText}` : `date:${fromText}..${toText}`;
  const tags = `${dateExpr} order:score`;
  return `/post.json?tags=${encodeURIComponent(tags)}&limit=${limit}&page=${page}`;
}

/** 本地时区的"今天"，供日期控件默认值与上限使用 */
export function todayRankingDate(now: Date = new Date()): RankingDate {
  return { year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() };
}

/** 日历日期加减天数（跨月/跨年由 Date 自动进位） */
export function shiftRankingDate(date: RankingDate, days: number): RankingDate {
  const next = new Date(date.year, date.month - 1, date.day + days);
  return { year: next.getFullYear(), month: next.getMonth() + 1, day: next.getDate() };
}

/**
 * ISO 8601 周：周一为一周开始，跨年时返回该周所属的周历年份。
 * 周榜默认值仍按 ISO 周取本周一至本周日，但请求以用户选择的区间为准。
 */
export function isoWeekOf(date: RankingDate): { year: number; week: number } {
  const target = new Date(Date.UTC(date.year, date.month - 1, date.day));
  const dayNumber = target.getUTCDay() || 7;
  // 移到本周周四，避免跨年时周数归属错误
  target.setUTCDate(target.getUTCDate() + 4 - dayNumber);
  const weekYear = target.getUTCFullYear();
  const yearStart = Date.UTC(weekYear, 0, 1);
  const week = Math.ceil(((target.getTime() - yearStart) / 86400000 + 1) / 7);
  return { year: weekYear, week };
}

/** ISO 周 → 该周周一的日历日期 */
export function dateFromIsoWeek(weekYear: number, week: number): RankingDate {
  const jan4 = new Date(weekYear, 0, 4);
  const dayNumber = jan4.getDay() || 7;
  const monday = new Date(weekYear, 0, 4 - (dayNumber - 1) + (week - 1) * 7);
  return { year: monday.getFullYear(), month: monday.getMonth() + 1, day: monday.getDate() };
}

/** 某周历年份的 ISO 周数（52 或 53） */
export function isoWeeksInYear(weekYear: number): number {
  return isoWeekOf({ year: weekYear, month: 12, day: 28 }).week;
}

/** 包含该日期的 ISO 周区间（周一至周日） */
export function weekRangeOf(date: RankingDate): RankingRange {
  const { year, week } = isoWeekOf(date);
  const monday = dateFromIsoWeek(year, week);
  return { from: monday, to: shiftRankingDate(monday, 6) };
}

/** 切到某榜类时的默认值：热门无日期，日=当天，周=本周一至周日，月=当月 1 日（02 §4） */
export function defaultRankingPeriod(kind: RankingKind, now: Date = new Date()): RankingPeriod {
  const today = todayRankingDate(now);
  switch (kind) {
    case 'popular':
      return { kind: 'popular' };
    case 'day':
      return { kind: 'day', date: today };
    case 'week':
      return { kind: 'week', range: weekRangeOf(today) };
    case 'month':
      return { kind: 'month', date: { year: today.year, month: today.month, day: 1 } };
  }
}

/** 计数行展示的期标签：日=日期、周=开始 — 结束、月=年月 */
export function formatRankingPeriodLabel(period: RankingPeriod): string {
  switch (period.kind) {
    case 'popular':
      return '';
    case 'day':
      return formatRankingDateInput(period.date);
    case 'week':
      return `${formatRankingDateInput(period.range.from)} — ${formatRankingDateInput(period.range.to)}`;
    case 'month':
      return `${period.date.year}-${pad2(period.date.month)}`;
  }
}

/** 判断两个期参数是否等价，避免控件回传同值时重复请求 */
export function sameRankingPeriod(a: RankingPeriod, b: RankingPeriod): boolean {
  if (a.kind !== b.kind) return false;
  switch (a.kind) {
    case 'popular':
      return true;
    case 'day':
    case 'month':
      return b.kind === a.kind && compareRankingDates(a.date, b.date) === 0;
    case 'week':
      return (
        b.kind === 'week' &&
        compareRankingDates(a.range.from, b.range.from) === 0 &&
        compareRankingDates(a.range.to, b.range.to) === 0
      );
  }
}

/** 与 `<input type="date">` 的 value 格式一致 */
export function formatRankingDateInput(date: RankingDate): string {
  return `${date.year}-${pad2(date.month)}-${pad2(date.day)}`;
}

/** 非法格式或不存在日期返回 null；日期控件只读取合法值 */
export function parseRankingDateInput(value: string): RankingDate | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (match === null) return null;

  const year = Number(match[1] ?? '');
  const month = Number(match[2] ?? '');
  const day = Number(match[3] ?? '');
  const candidate = new Date(year, month - 1, day);
  if (
    candidate.getFullYear() !== year ||
    candidate.getMonth() !== month - 1 ||
    candidate.getDate() !== day
  ) {
    return null;
  }
  return { year, month, day };
}
