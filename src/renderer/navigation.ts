import { sitesWithCapability } from '@shared/sites';

/** 07 DR-095 / T-39：侧栏五项，顺序固定；不设独立搜索项 */
export const NAV_ITEMS = [
  { id: 'home', label: '首页' },
  { id: 'daily', label: '每日壁纸' },
  { id: 'favorites', label: '收藏' },
  { id: 'downloads', label: '下载' },
  { id: 'settings', label: '设置' }
] as const;

export type PageId = (typeof NAV_ITEMS)[number]['id'];

/** DR-076 / T-53：入口按能力表驱动，没有任何站点具备每日壁纸能力时不出现该项 */
export const VISIBLE_NAV_ITEMS = NAV_ITEMS.filter(
  (item) => item.id !== 'daily' || sitesWithCapability('daily').length > 0
);
