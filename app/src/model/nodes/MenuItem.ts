import TreeNode from "./TreeNode";

export default interface MenuItem {
  id: number;
  name: string;
  item: TreeNode | undefined;
  action: ((menuItem: MenuItem) => void) | undefined;
}
