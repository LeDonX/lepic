import { computeMasonryLayout, EMPTY_MASONRY_LAYOUT, type MasonryLayout } from '@shared/masonry';
import type { Post } from '@shared/models';
import { postSelectionKey } from '@shared/selection';
import type { CSSProperties, ReactElement } from 'react';
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';

import { PostCard } from './PostCard';

const NEAR_END_PX = 300; // 02 §2.2：距底 300px 触发加载
const OVERSCAN_PX = 600; // 可视区上下缓冲，快速滚动不留白

export interface MasonryGridProps {
  posts: readonly Post[];
  viewedIds: ReadonlySet<number>;
  /** T-21：★ 角标数据源，与已看集合独立 */
  favoritedIds: ReadonlySet<number>;
  /** DR-069：关注动态未读集合，命中时卡片右上角显示红点 */
  unreadIds?: ReadonlySet<number>;
  /** T-27 / DR-039：多选键集合；仅在开启多选（传入 onToggleSelect）时渲染勾选框 */
  selectedKeys?: ReadonlySet<string>;
  loading: boolean;
  onNearEnd(): void;
  /** 02 §6.3：内容填不满视口时上报，供隐藏已看自动补页 */
  onUnderfilled?(): void;
  onToggleFavorite(post: Post): void;
  onToggleSelect?(post: Post, shiftKey: boolean): void;
  /** 右键卡片菜单（DR-046），坐标透传给页面 */
  onContextMenu?(x: number, y: number): void;
  onOpen(post: Post): void;
}

function postKey(post: Post): string {
  return `${post.site}:${post.id}`;
}

/**
 * 纵向跨列瀑布流（07 DR-097 / 02 §2.2）：skyline 排布、等比不裁切，
 * 按可视纵向区间虚拟化渲染；旧卡固定，新批次只填最矮列。
 */
export function MasonryGrid({
  posts,
  viewedIds,
  favoritedIds,
  unreadIds,
  selectedKeys,
  loading,
  onNearEnd,
  onUnderfilled,
  onToggleFavorite,
  onToggleSelect,
  onContextMenu,
  onOpen
}: MasonryGridProps): ReactElement {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [viewport, setViewport] = useState({ width: 0, height: 0 });
  const [scrollTop, setScrollTop] = useState(0);
  const [batchStarts, setBatchStarts] = useState<readonly number[]>([0]);
  const previousPostsRef = useRef<{ posts: readonly Post[]; starts: readonly number[] }>({
    posts: [],
    starts: [0]
  });
  const frameRef = useRef(0);
  const previousLayoutRef = useRef<MasonryLayout | null>(null);
  const anchorRef = useRef<{ key: string; offset: number } | null>(null);

  // 追加页视为新批次：只有新批次才重新获得 1 张 2 列卡名额；列表被替换 / 过滤变短则整体重算
  useEffect(() => {
    const previous = previousPostsRef.current;
    const firstPost = posts[0];
    const previousFirst = previous.posts[0];
    let starts: number[];
    if (firstPost === undefined || previousFirst === undefined) {
      starts = [0];
    } else if (postKey(firstPost) !== postKey(previousFirst) || posts.length < previous.posts.length) {
      starts = [0];
    } else if (posts.length > previous.posts.length) {
      starts = [...previous.starts, previous.posts.length];
    } else {
      starts = [...previous.starts];
    }

    previousPostsRef.current = { posts, starts };
    setBatchStarts((current) =>
      current.length === starts.length && current.every((value, index) => value === starts[index])
        ? current
        : starts
    );
  }, [posts]);

  useEffect(() => {
    const element = scrollRef.current;
    if (element === null) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry === undefined) return;
      setViewport({ width: entry.contentRect.width, height: entry.contentRect.height });
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const layout = useMemo(() => {
    const firstPost = posts[0];
    if (firstPost === undefined || viewport.width <= 0) return EMPTY_MASONRY_LAYOUT;
    return computeMasonryLayout(
      posts.map((post) => ({ aspectRatio: post.width / post.height })),
      {
        availableWidth: viewport.width,
        viewportHeight: viewport.height,
        batchStarts
      }
    );
  }, [posts, viewport.width, viewport.height, batchStarts]);

  // 列数变化时整体重算，滚动位置按「首张可见卡」保持（02 §2.2）
  useLayoutEffect(() => {
    const element = scrollRef.current;
    const previous = previousLayoutRef.current;
    previousLayoutRef.current = layout;
    if (element === null || previous === null || previous.columns === layout.columns) return;

    const anchor = anchorRef.current;
    if (anchor === null) return;
    const slot = layout.slots.find((candidate) => {
      const post = posts[candidate.index];
      return post !== undefined && postKey(post) === anchor.key;
    });
    if (slot === undefined) return;
    element.scrollTop = Math.max(0, slot.top - anchor.offset);
  }, [layout, posts]);

  useEffect(() => {
    const element = scrollRef.current;
    if (element === null || layout.slots.length === 0) return;
    const top = element.scrollTop;
    const first = layout.slots.find((slot) => slot.top + slot.height > top + 1);
    if (first === undefined) return;
    const post = posts[first.index];
    if (post === undefined) return;
    anchorRef.current = { key: postKey(post), offset: first.top - top };
  }, [layout, scrollTop, posts]);

  // 02 §6.3：过滤后内容填不满视口时不会产生滚动事件，需主动上报以便自动补页
  useEffect(() => {
    const element = scrollRef.current;
    // 首帧宽度未测量时布局为空，不能据此判定内容不足
    if (element === null || layout.slots.length === 0) return;
    if (element.scrollHeight - element.clientHeight < NEAR_END_PX) onUnderfilled?.();
  }, [layout.height, layout.slots.length, posts.length, viewport.width, onUnderfilled]);

  useEffect(() => {
    return () => {
      if (frameRef.current !== 0) window.cancelAnimationFrame(frameRef.current);
    };
  }, []);

  const handleScroll = (): void => {
    const element = scrollRef.current;
    if (element === null) return;
    if (element.scrollHeight - element.scrollTop - element.clientHeight < NEAR_END_PX) onNearEnd();
    if (frameRef.current !== 0) return;
    frameRef.current = window.requestAnimationFrame(() => {
      frameRef.current = 0;
      const current = scrollRef.current;
      if (current !== null) setScrollTop(current.scrollTop);
    });
  };

  const visibleSlots = useMemo(() => {
    if (layout.slots.length === 0 || viewport.height <= 0) return [];
    const from = scrollTop - OVERSCAN_PX;
    const to = scrollTop + viewport.height + OVERSCAN_PX;
    return layout.slots.filter((slot) => slot.top + slot.height >= from && slot.top <= to);
  }, [layout, scrollTop, viewport.height]);

  return (
    <div className="masonry-grid" ref={scrollRef} onScroll={handleScroll}>
      <div className="masonry-grid__canvas" style={{ height: layout.height }}>
        {visibleSlots.map((slot) => {
          const post = posts[slot.index];
          if (post === undefined) return null;

          const style: CSSProperties = {
            transform: `translate3d(${slot.left}px, ${slot.top}px, 0)`,
            width: slot.width,
            height: slot.height
          };

          return (
            <div key={postKey(post)} className="masonry-grid__item" style={style}>
              <PostCard
                post={post}
                fill
                viewed={viewedIds.has(post.id)}
                favorited={favoritedIds.has(post.id)}
                unread={unreadIds?.has(post.id) === true}
                selected={selectedKeys?.has(postSelectionKey(post)) === true}
                onToggleFavorite={onToggleFavorite}
                onToggleSelect={onToggleSelect}
                onContextMenu={onContextMenu}
                onOpen={onOpen}
              />
            </div>
          );
        })}
      </div>
      {/* DR-090：固定高度加载槽常驻占位，避免触底时滚动区域高度变化导致列表抖动 */}
      <div
        className="masonry-grid__loading"
        data-loading={loading ? 'true' : 'false'}
        role="status"
      >
        {loading ? '正在加载更多…' : ''}
      </div>
    </div>
  );
}
