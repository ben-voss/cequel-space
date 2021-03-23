import MenuItem from "./MenuItem";
import TreeNode from "./TreeNode";

export default class LoadingNode extends TreeNode {
  get menu(): MenuItem[] {
    return [];
  }

  constructor() {
    super("Loading...", "");
  }
}

export const loadingNode = new LoadingNode();
