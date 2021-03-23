import { mdiFolder } from "@mdi/js";
import MenuItem from "./MenuItem";
import TreeNode from "./TreeNode";

export default class TriggerNode extends TreeNode {
  private readonly objectId: number;

  constructor(objectId: number, name: string) {
    super(name, mdiFolder);

    this.objectId = objectId;
  }

  public get menu(): MenuItem[] {
    return [];
  }
}
