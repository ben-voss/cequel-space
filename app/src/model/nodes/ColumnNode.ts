import Tab from "../Tab";
import MenuItem from "./MenuItem";
import TreeNode from "./TreeNode";
import { mdiFolder } from "@mdi/js";
import Api from "@/api/Api";
import { inject } from "inversify";
import { Symbols } from "@/di";
import { Store } from "vuex";
import AppState from "@/store/AppState";

export default class ColumnNode extends TreeNode {
  private readonly api: Api;
  // Store needs to be held in a function to prevent vue from crashing with a stack overflow error.
  private readonly store!: () => Store<AppState>;
  private readonly tabFactory: () => Tab;

  private tableName: string;
  private readonly columnId: number;

  constructor(
    @inject(Symbols.Api) api: Api,
    @inject(Symbols.Store) store: Store<AppState>,
    @inject(Symbols.TabFactory) tabFactory: () => Tab,
    columnId: number,
    tableName: string,
    name: string
  ) {
    super(name, mdiFolder);

    this.api = api;
    this.store = () => {
      return store;
    };
    this.tabFactory = tabFactory;

    this.tableName = tableName;
    this.columnId = columnId;
  }

  public get menu(): MenuItem[] {
    return [
      {
        id: 1,
        name: "Modify",
        item: this,
        action: () => this.edit()
      },
      {
        id: 2,
        name: "Delete",
        item: this,
        action: () => this.drop()
      }
    ];
  }

  private async edit(): Promise<void> {
    return await this.addTab(
      "ALTER TABLE " + this.tableName + "\nALTER COLUMN " + this.name + "\n"
    );
  }

  private async drop(): Promise<void> {
    return await this.addTab(
      "ALTER TABLE " + this.tableName + "\nDROP COLUMN " + this.name + "\n"
    );
  }

  private async addTab(sqlText: string): Promise<void> {
    const tab = this.tabFactory();
    tab.sqlText = sqlText;

    return this.store().dispatch("tabs/add", { tab });
  }
}
