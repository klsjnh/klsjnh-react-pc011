/**
 * 表格体高度自适应：实测「卡片高度 - 表头 - 分页（含外边距）」。
 *
 * 用 `calc(100vh - Npx)` 估值会随工具栏折行 / 窗口高度失准，残余高度就会顶出外层滚动条。
 * 这里的前提是 `.page-fill` 的 flex 布局让卡片高度由容器决定（与数据量无关，无循环依赖），
 * 卡片又 `overflow: hidden`，即使测量差 1~2px 也只会被卡片裁掉，不会外溢成页面滚动条。
 *
 * @param cardRef   包住 Table 的 Card ref（Card 需带 `className="table-wrapper"`）
 * @param signature 数据 / 加载态变化时补测一次的信号量（表头、分页会随数据出现或改变，
 *                  而卡片高度不变 → ResizeObserver 不会触发）。通常传 `${total}-${loading}`。
 */
import { useEffect, useRef, useState, type RefObject } from 'react';

export function useTableFillHeight(
  cardRef: RefObject<HTMLDivElement | null>,
  signature?: unknown,
): number | undefined {
  const [height, setHeight] = useState<number>();
  const measureRef = useRef<() => void>(() => {});

  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;

    measureRef.current = () => {
      const head = card.querySelector<HTMLElement>('.ant-table-header');
      const pager = card.querySelector<HTMLElement>('.ant-table-pagination');
      const headH = head?.offsetHeight ?? 47;
      let pagerH = 0;
      if (pager) {
        const cs = getComputedStyle(pager);
        pagerH = pager.offsetHeight + (parseFloat(cs.marginTop) || 0) + (parseFloat(cs.marginBottom) || 0);
      }
      const next = Math.max(120, Math.floor(card.clientHeight - headH - pagerH - 2));
      setHeight((prev) => (prev === next ? prev : next));
    };

    measureRef.current();
    // 首帧还是整表（无 scroll.y），表头/分页测量值不可靠 → 下一帧补测一次
    const timer = window.setTimeout(() => measureRef.current(), 0);
    const ro = new ResizeObserver(() => measureRef.current());
    ro.observe(card);
    return () => { ro.disconnect(); window.clearTimeout(timer); };
  }, [cardRef]);

  useEffect(() => { measureRef.current(); }, [signature]);

  return height;
}
