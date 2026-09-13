/** UI 状态类型（localStorage 持久化） */
export interface UiState {
  /** 左侧导航侧边栏是否收起 */
  sidebarCollapsed: boolean;
  /** 菜单管理树展开的节点 ID（null = 从未设置，使用默认值：仅第一个顶级展开） */
  menuTreeExpandedIds: number[] | null;
  /** 菜单管理树当前选中节点 */
  menuTreeSelectedId: number | null;
}
