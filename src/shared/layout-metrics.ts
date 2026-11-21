/**
 * 07 DR-097 / 02 §2.2：纵向跨列瀑布流的尺寸参数。
 * 只放常量与纯计算，供布局算法与单测共用（05 §2：shared 不含 Node / DOM）。
 */
export const MASONRY_GAP = 14;
export const MASONRY_BASE_COLUMN = 240;
export const MASONRY_MIN_COLUMNS = 3;
export const MASONRY_MAX_COLUMNS = 6;
export const MASONRY_SPAN_MAX = 3;

/** 3 列卡只用于宽高比 ≥ 2.4 的全景图 */
export const MASONRY_PANORAMA_RATIO = 2.4;

/** 提升后高度上限：min(可视高 × 60%, 520px) */
export const MASONRY_PROMOTE_VIEWPORT_RATIO = 0.6;
export const MASONRY_PROMOTE_HEIGHT_CAP = 520;
