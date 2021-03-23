import MenuItem from "./MenuItem";
import { v1 as uuid } from "uuid";

export default abstract class TreeNode {
  public id: string = uuid();
  public readonly name: string;
  public readonly icon: string;
  public children: TreeNode[] = [];
  public shouldLoadChildren = false;

  constructor(name: string, icon: string) {
    this.name = name;
    this.icon = icon;
  }

  abstract get menu(): MenuItem[];

  async loadChildren(): Promise<void> {
    return;
  }
}
