import { mdiContentCut } from "@mdi/js";
import Tab from "@/model/Tab";
import Command from "./Command";
import BaseCommand from "./BaseCommand";
import { inject, injectable } from "inversify";
import { Symbols } from "@/di";
import { Store } from "vuex";
import AppState from "@/store/AppState";

@injectable()
export default class CutCommand extends BaseCommand implements Command {
  private store: Store<AppState>;

  constructor(@inject(Symbols.Store) store: Store<AppState>) {
    super("cut", "Cut", mdiContentCut);

    this.store = store;
  }

  public action(): void {
    if (!this.selectedTab) {
      return;
    }

    const session = this.selectedTab.session;
    const range = session.getSelection().getRange();
    const selectedText = session.getTextRange(range);

    session.remove(range);

    navigator.clipboard.writeText(selectedText);
  }

  public get isDisabled(): boolean {
    return false;
  }

  private get selectedTab(): Tab | null {
    return this.store.getters["tabs/selected"] as Tab | null;
  }
}
