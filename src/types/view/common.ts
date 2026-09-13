/** 通用 UI 基础类型 */
/** id 统一为 string | number：本地 mock 可能给数字，后端真实数据为 UUID 字符串 */
export type NodeId = string | number;

/** 组织树节点（穿梭框 / 选择器等通用树组件用；id 为后端 UUID 字符串） */
export interface OrgTreeNode {
  id: string;
  name: string;
  type: string;
  children?: OrgTreeNode[];
}
