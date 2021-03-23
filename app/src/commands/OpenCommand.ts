import { mdiArrowUpCircleOutline } from "@mdi/js";
import Tab from "@/model/Tab";
import Command from "./Command";
import BaseCommand from "./BaseCommand";
import { basename, extname } from "path";
import { Store } from "vuex";
import { inject, injectable } from "inversify";
import { Symbols } from "@/di";
import Api from "@/api/Api";
import AppState from "@/store/AppState";

@injectable()
export default class OpenCommand extends BaseCommand implements Command {
  private readonly store: Store<AppState>;
  private readonly api: Api;
  private readonly tabFactory: () => Tab;

  constructor(
    @inject(Symbols.Store) store: Store<AppState>,
    @inject(Symbols.Api) api: Api,
    @inject(Symbols.TabFactory) tabFactory: () => Tab
  ) {
    super("open", "Open", mdiArrowUpCircleOutline);

    this.store = store;
    this.api = api;
    this.tabFactory = tabFactory;
  }

  public ipcRendererAction(args: string[]): void {
    this.addTab(args[1], args[2]);
  }

  public async action(): Promise<void> {
    const file = await this.api.open();

    if (!file) {
      return;
    }

    this.addTab(file.name, file.content);
  }

  private addTab(fileName: string, content: string): void {
    const tab = this.tabFactory();
    tab.fileName = fileName;
    tab.name = basename(fileName, extname(fileName));
    tab.sqlText = content;

    this.store.dispatch("tabs/add", { tab });
  }

  public get isDisabled(): boolean {
    return false;
  }
}
