import Tab from "@/model/Tab";
import Command from "./Command";
import BaseCommand from "./BaseCommand";
import { basename, extname } from "path";
import { Store } from "vuex";
import { inject, injectable } from "inversify";
import { Symbols } from "@/di";
import AppState from "@/store/AppState";
import Api from "@/api/Api";

@injectable()
export default class SaveAsCommand extends BaseCommand implements Command {
  private api: Api;
  private store: Store<AppState>;

  constructor(
    @inject(Symbols.Api) api: Api,
    @inject(Symbols.Store) store: Store<AppState>
  ) {
    super("saveAs", "Save As", "");

    this.api = api;
    this.store = store;
  }

  public get isDisabled(): boolean {
    if (!this.selectedTab) {
      return true;
    }

    return this.selectedTab.session.getUndoManager().isClean();
  }

  private get selectedTab(): Tab | null {
    return this.store.getters["tabs/selected"] as Tab | null;
  }

  public async action(): Promise<void> {
    const tab = this.selectedTab;
    if (!tab) {
      return;
    }

    const fileName = await this.api.saveAs(tab.sqlText, "sql");

    if (fileName) {
      tab.fileName = fileName;
      tab.session.getUndoManager().markClean();
      tab.name = basename(fileName, extname(fileName));

      this.api.setRepresentedFilename(fileName);
    }
  }
}
