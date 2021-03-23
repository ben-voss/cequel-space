import Tab from "@/model/Tab";
import Command from "./Command";
import BaseCommand from "./BaseCommand";
import { Store } from "vuex";
import { inject, injectable } from "inversify";
import { Symbols } from "@/di";
import AppState from "@/store/AppState";
import Api from "@/api/Api";

@injectable()
export default class CloseSelectedEditorCommand extends BaseCommand
  implements Command {
  private api: Api;
  private store: Store<AppState>;

  constructor(
    @inject(Symbols.Api) api: Api,
    @inject(Symbols.Store) store: Store<AppState>
  ) {
    super("closeSelectedEditor", "Close Editor", "");

    this.api = api;
    this.store = store;
  }

  public async action(): Promise<void> {
    const tab = this.selectedTab;
    if (!tab) {
      return;
    }

    // Just remove the tab when there are no changes to save.
    if (tab.session.getUndoManager().isClean()) {
      return this.store.dispatch("tabs/delete", { tab });
    }

    const response = await this.api.messageBox({
      type: "question",
      buttons: ["Save", "Don't Save", "Cancel"],
      message: "Do you want to save the changes you made to " + tab.name + "?",
      detail: "Your changes will be lost if you don't save them.",
      cancelId: 2
    });

    if (response === 0) {
      // Save
      if (tab.fileName) {
        await this.api.save(tab.fileName, tab.sqlText, "sql");
        return this.store.dispatch("tabs/delete", { tab });
      } else {
        const fileName = await this.api.saveAs(tab.sqlText, "sql");
        if (fileName) {
          return this.store.dispatch("tabs/delete", { tab });
        }
      }
    } else if (response === 1) {
      // Don't save
      return this.store.dispatch("tabs/delete", { tab });
    } else if (response === 2) {
      // Cancel
      return;
    }
  }

  public get isDisabled(): boolean {
    return this.selectedTab === null;
  }

  protected get selectedTab(): Tab | null {
    return this.store.getters["tabs/selected"] as Tab | null;
  }
}
