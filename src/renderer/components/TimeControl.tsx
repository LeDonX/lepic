import {
  compareRankingDates,
  formatRankingDateInput,
  parseRankingDateInput,
  type RankingDate,
  type RankingPeriod,
  todayRankingDate
} from '@shared/rankings';
import type { ChangeEvent, ReactElement } from 'react';

import styles from './TimeControl.module.css';

export interface TimeControlProps {
  period: RankingPeriod;
  /** 热门或无榜单能力时禁用，但保留外观与尺寸（02 §2.1） */
  disabled: boolean;
  onChange(period: RankingPeriod): void;
}

const MIN_YEAR = 2005;

/** 02 §2.1 / §4：时间控件常显；日=日期，周=日期范围，月=年 + 月 */
export function TimeControl({ period, disabled, onChange }: TimeControlProps): ReactElement {
  const today = todayRankingDate();
  const maxDate = formatRankingDateInput(today);

  if (period.kind === 'week') {
    const { from, to } = period.range;
    const applyFrom = (event: ChangeEvent<HTMLInputElement>): void => {
      const next = parseRankingDateInput(event.target.value);
      if (next === null) return;
      // 开始不得晚于结束：越过时把结束一起推到开始
      const range = compareRankingDates(next, to) > 0 ? { from: next, to: next } : { from: next, to };
      onChange({ kind: 'week', range });
    };
    const applyTo = (event: ChangeEvent<HTMLInputElement>): void => {
      const next = parseRankingDateInput(event.target.value);
      if (next === null) return;
      // 结束不得早于开始：越过时把开始一起拉到结束
      const range = compareRankingDates(next, from) < 0 ? { from: next, to: next } : { from, to: next };
      onChange({ kind: 'week', range });
    };

    return (
      <div className={styles.root} role="group" aria-label="榜单时间范围">
        <input
          type="date"
          className={styles.field}
          aria-label="榜单开始日期"
          value={formatRankingDateInput(from)}
          max={maxDate}
          disabled={disabled}
          onChange={applyFrom}
        />
        <span className={styles.separator} aria-hidden="true">
          —
        </span>
        <input
          type="date"
          className={styles.field}
          aria-label="榜单结束日期"
          value={formatRankingDateInput(to)}
          max={maxDate}
          disabled={disabled}
          onChange={applyTo}
        />
      </div>
    );
  }

  if (period.kind === 'month') {
    const { year, month } = period.date;
    const years: number[] = [];
    for (let value = MIN_YEAR; value <= today.year; value += 1) years.push(value);
    const maxMonth = year === today.year ? today.month : 12;
    const applyYear = (event: ChangeEvent<HTMLSelectElement>): void => {
      const nextYear = Number(event.target.value);
      if (!Number.isInteger(nextYear)) return;
      const nextMonth = Math.min(month, nextYear === today.year ? today.month : 12);
      onChange({ kind: 'month', date: { year: nextYear, month: nextMonth, day: 1 } });
    };
    const applyMonth = (event: ChangeEvent<HTMLSelectElement>): void => {
      const nextMonth = Number(event.target.value);
      if (!Number.isInteger(nextMonth)) return;
      onChange({ kind: 'month', date: { year, month: nextMonth, day: 1 } });
    };

    return (
      <div className={styles.root} role="group" aria-label="榜单月份">
        <select
          className={styles.field}
          aria-label="榜单年份"
          value={year}
          disabled={disabled}
          onChange={applyYear}
        >
          {years.map((value) => (
            <option key={value} value={value}>
              {value} 年
            </option>
          ))}
        </select>
        <select
          className={styles.field}
          aria-label="榜单月份"
          value={month}
          disabled={disabled}
          onChange={applyMonth}
        >
          {Array.from({ length: maxMonth }, (_, index) => index + 1).map((value) => (
            <option key={value} value={value}>
              {value} 月
            </option>
          ))}
        </select>
      </div>
    );
  }

  // 热门与日榜都用日期控件占位；热门禁用并显示当天，尺寸与日榜一致
  const date: RankingDate = period.kind === 'day' ? period.date : today;
  const applyDate = (event: ChangeEvent<HTMLInputElement>): void => {
    const next = parseRankingDateInput(event.target.value);
    if (next === null) return;
    onChange({ kind: 'day', date: next });
  };

  return (
    <div className={styles.root} role="group" aria-label="榜单日期">
      <input
        type="date"
        className={styles.field}
        aria-label="榜单日期"
        value={formatRankingDateInput(date)}
        max={maxDate}
        disabled={disabled}
        onChange={applyDate}
      />
    </div>
  );
}
