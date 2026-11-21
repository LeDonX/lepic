import {
  MASONRY_BASE_COLUMN,
  MASONRY_GAP,
  MASONRY_MAX_COLUMNS,
  MASONRY_MIN_COLUMNS,
  MASONRY_PANORAMA_RATIO,
  MASONRY_PROMOTE_HEIGHT_CAP,
  MASONRY_PROMOTE_VIEWPORT_RATIO,
  MASONRY_SPAN_MAX
} from './layout-metrics';

/** 布局只需要宽高比；宽高比非法时按 1 处理，避免除零与 NaN 走进样式 */
export interface MasonryInputItem {
  aspectRatio: number;
}

export interface MasonrySlot {
  /** 对应输入列表下标，渲染时据此取回 Post */
  index: number;
  span: number;
  /** 起始列（0 起） */
  column: number;
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface MasonryLayout {
  columns: number;
  columnWidth: number;
  width: number;
  height: number;
  slots: MasonrySlot[];
}

export interface MasonryOptions {
  /** 网格可用宽度（不含内边距） */
  availableWidth: number;
  /** 内容区可视高度，用于大卡提升的高度上限 */
  viewportHeight: number;
  /** 每批起始下标（必须含 0）：「每批最多 1 张 2 列卡」的批次边界 */
  batchStarts?: readonly number[];
}

export const EMPTY_MASONRY_LAYOUT: MasonryLayout = {
  columns: MASONRY_MIN_COLUMNS,
  columnWidth: 0,
  width: 0,
  height: 0,
  slots: []
};

/** 02 §2.2：列数 = clamp(3, floor((W + G) / (240 + G)), 6) */
export function masonryColumnCount(availableWidth: number): number {
  if (!Number.isFinite(availableWidth) || availableWidth <= 0) return MASONRY_MIN_COLUMNS;
  const raw = Math.floor((availableWidth + MASONRY_GAP) / (MASONRY_BASE_COLUMN + MASONRY_GAP));
  return Math.min(MASONRY_MAX_COLUMNS, Math.max(MASONRY_MIN_COLUMNS, raw));
}

/** 基准列宽按容器等分，保证网格右边缘也恰好留一个 G（不夹紧、不补白） */
export function masonryColumnWidth(availableWidth: number, columns: number): number {
  if (columns <= 0) return 0;
  const width = (availableWidth - (columns - 1) * MASONRY_GAP) / columns;
  return width > 0 ? width : 0;
}

function normalizeRatio(aspectRatio: number): number {
  return Number.isFinite(aspectRatio) && aspectRatio > 0 ? aspectRatio : 1;
}

/**
 * skyline：在全部可容纳该跨度的连续列组里取组内最高列最矮的一组，同高取最左（DR-097）。
 */
function pickStartColumn(nextY: readonly number[], span: number): number {
  let best = 0;
  let bestHeight = Number.POSITIVE_INFINITY;
  for (let start = 0; start + span <= nextY.length; start += 1) {
    let groupHeight = 0;
    for (let offset = 0; offset < span; offset += 1) {
      groupHeight = Math.max(groupHeight, nextY[start + offset] ?? 0);
    }
    if (groupHeight < bestHeight) {
      bestHeight = groupHeight;
      best = start;
    }
  }
  return best;
}

/**
 * 纵向跨列瀑布流布局（DR-097）：按结果顺序放置到最矮的连续列组，
 * 卡片高度 = 宽度 ÷ 原图宽高比（不裁切、不拉伸），列底允许参差。
 */
export function computeMasonryLayout(
  items: readonly MasonryInputItem[],
  options: MasonryOptions
): MasonryLayout {
  const { availableWidth, viewportHeight, batchStarts = [0] } = options;
  const columns = masonryColumnCount(availableWidth);
  const columnWidth = masonryColumnWidth(availableWidth, columns);

  if (items.length === 0 || columnWidth <= 0) {
    return { ...EMPTY_MASONRY_LAYOUT, columns, columnWidth, width: availableWidth };
  }

  const promoteHeightCap =
    viewportHeight > 0
      ? Math.min(viewportHeight * MASONRY_PROMOTE_VIEWPORT_RATIO, MASONRY_PROMOTE_HEIGHT_CAP)
      : MASONRY_PROMOTE_HEIGHT_CAP;

  const batchStartSet = new Set(batchStarts);
  const nextY = new Array<number>(columns).fill(0);
  const slots: MasonrySlot[] = [];
  let twoColumnUsedInBatch = false;
  let maxBottom = 0;

  for (let index = 0; index < items.length; index += 1) {
    const item = items[index];
    if (item === undefined) continue;

    if (batchStartSet.has(index)) twoColumnUsedInBatch = false;

    const ratio = normalizeRatio(item.aspectRatio);
    let span = 1;

    if (ratio >= MASONRY_PANORAMA_RATIO) {
      // 3 列卡只给全景图；提升后过高就退回 1 列，不再降级成 2 列（02 §2.2）
      const wideHeight =
        (columnWidth * MASONRY_SPAN_MAX + (MASONRY_SPAN_MAX - 1) * MASONRY_GAP) / ratio;
      if (wideHeight <= promoteHeightCap) span = MASONRY_SPAN_MAX;
    } else if (!twoColumnUsedInBatch) {
      const doubleHeight = (columnWidth * 2 + MASONRY_GAP) / ratio;
      if (doubleHeight <= promoteHeightCap) {
        span = 2;
        twoColumnUsedInBatch = true;
      }
    }

    const column = pickStartColumn(nextY, span);
    let top = 0;
    for (let offset = 0; offset < span; offset += 1) {
      top = Math.max(top, nextY[column + offset] ?? 0);
    }

    const width = columnWidth * span + (span - 1) * MASONRY_GAP;
    // 不裁切、不夹紧：高度完全由原图比例决定，列底参差是顺序优先的必然结果
    const height = width / ratio;

    slots.push({
      index,
      span,
      column,
      left: column * (columnWidth + MASONRY_GAP),
      top,
      width,
      height
    });

    for (let offset = 0; offset < span; offset += 1) {
      nextY[column + offset] = top + height + MASONRY_GAP;
    }
    maxBottom = Math.max(maxBottom, top + height);
  }

  return {
    columns,
    columnWidth,
    width: availableWidth,
    height: maxBottom,
    slots
  };
}
