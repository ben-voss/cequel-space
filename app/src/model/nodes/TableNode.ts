import Tab from "../Tab";
import MenuItem from "./MenuItem";
import TreeNode from "./TreeNode";
import { mdiFolder } from "@mdi/js";
import { loadingNode } from "./LoadingNode";
import Api from "@/api/Api";
import { inject } from "inversify";
import { Symbols } from "@/di";
import { Store } from "vuex";
import AppState from "@/store/AppState";

export default class TableNode extends TreeNode {
  private readonly api: Api;
  // Store needs to be held in a function to prevent vue from crashing with a stack overflow error.
  private readonly store!: () => Store<AppState>;
  private readonly tabFactory: () => Tab;

  public readonly tableId: number;

  constructor(
    @inject(Symbols.Api) api: Api,
    @inject(Symbols.Store) store: Store<AppState>,
    @inject(Symbols.TabFactory) tabFactory: () => Tab,
    tableId: number,
    name: string
  ) {
    super(name, mdiFolder);

    this.api = api;
    this.store = () => {
      return store;
    };
    this.tabFactory = tabFactory;

    this.shouldLoadChildren = true;
    this.children = [loadingNode];
    this.tableId = tableId;
  }

  public get menu(): MenuItem[] {
    return [
      {
        id: 1,
        name: "Select",
        item: this,
        action: () => this.select()
      },
      {
        id: 1,
        name: "Row Count",
        item: this,
        action: () => this.rowCount()
      },
      {
        id: 2,
        name: "-",
        item: undefined,
        action: undefined
      },
      {
        id: 3,
        name: "New Column",
        item: this,
        action: () => this.newColumn()
      },
      {
        id: 3,
        name: "Delete",
        item: this,
        action: () => this.drop()
      },
      {
        id: 4,
        name: "-",
        item: undefined,
        action: undefined
      },
      {
        id: 5,
        name: "Refresh",
        item: this,
        action: () => this.loadChildren()
      }
    ];
  }

  public async loadChildren(): Promise<void> {
    await this.store().dispatch("schema/getColumns", {
      tableId: this.tableId
    });

    this.children = this.store().getters["schema/columnsForTable"](
      this.tableId as number
    );
    this.shouldLoadChildren = false;
  }

  private async select(): Promise<void> {
    return await this.addTab("SELECT TOP 1000 * FROM " + this.name + "\n");
  }

  private async rowCount(): Promise<void> {
    return await this.addTab("SELECT Count(*) FROM " + this.name + "\n");
  }

  private async newColumn(): Promise<void> {
    return await this.addTab("ALTER TABLE " + this.name + "\nADD COLUMN ");
  }

  private async drop(): Promise<void> {
    return await this.addTab("DROP TABLE " + this.name + "\n");
  }

  private async addTab(sqlText: string): Promise<void> {
    const tab = this.tabFactory();
    tab.sqlText = sqlText;

    return this.store().dispatch("tabs/add", { tab });
  }
}
