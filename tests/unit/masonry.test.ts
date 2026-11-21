import { MASONRY_GAP } from '@shared/layout-metrics';
import { computeMasonryLayout, masonryColumnCount, masonryColumnWidth } from '@shared/masonry';
import { describe, expect, it } from 'vitest';

/** 748 = 3 × 240 + 2 × 14，正好三列且基准列宽为 240 */
const WIDTH_3_COLUMNS = 748;

const items = (ratios: readonly number[]): { aspectRatio: number }[] =>
  ratios.map((aspectRatio) => ({ aspectRatio }));

describe('masonryColumnCount / masonryColumnWidth（02 §2.2）', () => {
  it('按容器宽度等分 3–6 列', () => {
    expect(masonryColumnCount(1440)).toBe(5);
    expect(masonryColumnCount(1080)).toBe(4);
    expect(masonryColumnCount(800)).toBe(3);
    expect(masonryColumnCount(2000)).toBe(6);
  });

  it('窄容器兜底 3 列，非法宽度不产生 NaN', () => {
    expect(masonryColumnCount(700)).toBe(3);
    expect(masonryColumnCount(0)).toBe(3);
    expect(masonryColumnCount(Number.NaN)).toBe(3);
  });

  it('列宽等分网格可用宽度（扣除列间距）', () => {
    expect(masonryColumnWidth(1440, 5)).toBeCloseTo((1440 - 4 * MASONRY_GAP) / 5, 6);
    expect(masonryColumnWidth(WIDTH_3_COLUMNS, 3)).toBe(240);
  });
});

describe('computeMasonryLayout skyline 排布', () => {
  it('按顺序放进最矮列，列底允许参差且间距恒为 14px', () => {
    const layout = computeMasonryLayout(items([1, 1, 1, 1]), {
      availableWidth: WIDTH_3_COLUMNS,
      viewportHeight: 500
    });

    expect(layout.columns).toBe(3);
    expect(layout.slots.map((slot) => [slot.column, slot.top])).toEqual([
      [0, 0],
      [1, 0],
      [2, 0],
      [0, 240 + MASONRY_GAP]
    ]);
    expect(layout.height).toBe(240 * 2 + MASONRY_GAP);
  });

  it('同高时取最左的连续列组', () => {
    const layout = computeMasonryLayout(items([1, 0.5, 1, 1]), {
      availableWidth: WIDTH_3_COLUMNS,
      viewportHeight: 500
    });

    // 第 2 张竖图更高；第 4 张在 col0 与 col2 同高时落到最左的 col0
    expect(layout.slots[3]?.column).toBe(0);
    expect(layout.slots[3]?.top).toBe(240 + MASONRY_GAP);
  });

  it('等比不裁切：高度 = 宽度 ÷ 原图宽高比，宽度 = 跨度 × 基准列宽 + 跨距', () => {
    const layout = computeMasonryLayout(items([1.5, 0.75, 1]), {
      availableWidth: WIDTH_3_COLUMNS,
      viewportHeight: 500
    });

    for (const slot of layout.slots) {
      expect(slot.span).toBe(1);
      expect(slot.width).toBeCloseTo(240, 6);
    }
    expect(layout.slots[0]?.height).toBeCloseTo(240 / 1.5, 6);
    expect(layout.slots[1]?.height).toBeCloseTo(240 / 0.75, 6);
    expect(layout.slots[2]?.height).toBeCloseTo(240, 6);
  });

  it('每批最多 1 张 2 列卡，新批次重新获得名额', () => {
    const layout = computeMasonryLayout(items([2, 2, 2, 2]), {
      availableWidth: WIDTH_3_COLUMNS,
      viewportHeight: 500,
      batchStarts: [0, 2]
    });

    expect(layout.slots.map((slot) => slot.span)).toEqual([2, 1, 2, 1]);
  });

  it('2 列卡提升后超过 min(可视高 × 60%, 520px) 时退回 1 列', () => {
    const layout = computeMasonryLayout(items([1]), {
      availableWidth: WIDTH_3_COLUMNS,
      viewportHeight: 500
    });

    expect(layout.slots[0]?.span).toBe(1);
  });

  it('3 列卡只给宽高比 ≥ 2.4 且高度不超上限的全景图，超限退回 1 列', () => {
    const tall = computeMasonryLayout(items([2.4]), {
      availableWidth: WIDTH_3_COLUMNS,
      viewportHeight: 500
    });
    const wide = computeMasonryLayout(items([2.4]), {
      availableWidth: WIDTH_3_COLUMNS,
      viewportHeight: 900
    });
    const notPanorama = computeMasonryLayout(items([2.2]), {
      availableWidth: WIDTH_3_COLUMNS,
      viewportHeight: 900
    });

    expect(tall.slots[0]?.span).toBe(1);
    expect(wide.slots[0]?.span).toBe(3);
    expect(wide.slots[0]?.width).toBeCloseTo(240 * 3 + 2 * MASONRY_GAP, 6);
    expect(notPanorama.slots[0]?.span).toBe(2);
  });

  it('1 列卡不限高，竖图也按原比例完整展示', () => {
    const layout = computeMasonryLayout(items([0.2]), {
      availableWidth: WIDTH_3_COLUMNS,
      viewportHeight: 500
    });

    expect(layout.slots[0]?.span).toBe(1);
    expect(layout.slots[0]?.height).toBeCloseTo(240 / 0.2, 6);
  });
});

describe('computeMasonryLayout 追加与大数据量', () => {
  const ratios = [1, 1.2, 0.7, 2, 2.6, 1.5, 0.9, 3];

  const ratioItems = (length: number): { aspectRatio: number }[] =>
    Array.from({ length }, (_item, index) => ({
      aspectRatio: ratios[index % ratios.length] ?? 1
    }));

  it('追加新批次不重排旧卡位置', () => {
    const prefix = computeMasonryLayout(ratioItems(300), {
      availableWidth: 1200,
      viewportHeight: 720,
      batchStarts: [0]
    });
    const appended = computeMasonryLayout(ratioItems(500), {
      availableWidth: 1200,
      viewportHeight: 720,
      batchStarts: [0, 300]
    });

    expect(appended.slots.slice(0, 300)).toEqual(prefix.slots);
  });

  it('1000 项全部落位、同列不重叠且行间距不小于 14px', () => {
    const layout = computeMasonryLayout(ratioItems(1000), {
      availableWidth: 1200,
      viewportHeight: 720,
      batchStarts: Array.from({ length: 10 }, (_item, index) => index * 100)
    });

    expect(layout.slots).toHaveLength(1000);
    expect(new Set(layout.slots.map((slot) => slot.index)).size).toBe(1000);

    const byColumn = new Map<number, { top: number; height: number }[]>();
    for (const slot of layout.slots) {
      expect(slot.top).toBeGreaterThanOrEqual(0);
      expect(slot.top + slot.height).toBeLessThanOrEqual(layout.height + 1e-6);
      expect(slot.height).toBeCloseTo(slot.width / (ratios[slot.index % ratios.length] ?? 1), 6);

      for (let column = slot.column; column < slot.column + slot.span; column += 1) {
        const list = byColumn.get(column) ?? [];
        list.push({ top: slot.top, height: slot.height });
        byColumn.set(column, list);
      }
    }

    for (const list of byColumn.values()) {
      const sorted = [...list].sort((left, right) => left.top - right.top);
      for (let index = 1; index < sorted.length; index += 1) {
        const previous = sorted[index - 1];
        const current = sorted[index];
        if (previous === undefined || current === undefined) continue;
        expect(current.top - (previous.top + previous.height)).toBeGreaterThanOrEqual(
          MASONRY_GAP - 1e-6
        );
      }
    }
  });
});
