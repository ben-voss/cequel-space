import { mdiFolder } from "@mdi/js";
import Tab from "../Tab";
import MenuItem from "./MenuItem";
import TreeNode from "./TreeNode";
import Connection from "../Connection";
import Api from "@/api/Api";
import { inject } from "inversify";
import { Symbols } from "@/di";
import { Store } from "vuex";
import AppState from "@/store/AppState";

export default class ViewNode extends TreeNode {
  private readonly api: Api;
  // Store needs to be held in a function to prevent vue from crashing with a stack overflow error.
  private readonly store!: () => Store<AppState>;
  private readonly tabFactory: () => Tab;

  private readonly objectId: number;

  constructor(
    @inject(Symbols.Api) api: Api,
    @inject(Symbols.Store) store: Store<AppState>,
    @inject(Symbols.TabFactory) tabFactory: () => Tab,
    objectId: number,
    name: string
  ) {
    super(name, mdiFolder);

    this.api = api;
    this.store = () => {
      return store;
    };
    this.tabFactory = tabFactory;

    this.objectId = objectId;
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
        id: 2,
        name: "-",
        item: undefined,
        action: undefined
      },
      {
        id: 3,
        name: "Edit",
        item: this,
        action: () => this.edit()
      },
      {
        id: 4,
        name: "Delete",
        item: this,
        action: () => this.drop()
      }
    ];
  }

  private async select(): Promise<void> {
    return await this.addTab("SELECT TOP 1000 * FROM " + this.name + "\n");
  }

  private async exec(
    query: string
  ): Promise<(string | number | null)[][] | null> {
    const connection = this.store().getters[
      "connections/selected"
    ] as Connection | null;
    if (!connection) {
      return null;
    }

    const batchJob = await this.api.addBatchJob({
      id: undefined,
      connectionId: connection.id as string,
      query: query
    });

    const recordSet = await this.api.getBatchJob(batchJob.id as string);

    if (!recordSet.length || !recordSet[0].data) {
      return null;
    }

    return recordSet[0].data;
  }

  private async edit(): Promise<void> {
    const records = await this.exec(
      "SELECT Object_definition(object_id) FROM sys.views WHERE object_id = " +
        this.objectId
    );

    if (!records || records.length < 1 || records[0].length < 1) {
      return;
    }

    let sqlText = records[0][0] as string;
    const index = sqlText.indexOf("create view");
    sqlText = sqlText.substr(0, index) + "alter" + sqlText.substr(index + 6);

    return await this.addTab(sqlText);
  }

  private async drop(): Promise<void> {
    return await this.addTab("DROP VIEW " + this.name + "\n");
  }

  private async addTab(sqlText: string): Promise<void> {
    const tab = this.tabFactory();
    tab.sqlText = sqlText;

    return this.store().dispatch("tabs/add", { tab });
  }
}
