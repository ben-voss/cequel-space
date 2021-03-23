import Tab from "@/model/Tab";
import { mdiContentPaste } from "@mdi/js";
import BaseCommand from "./BaseCommand";
import Command from "./Command";
import { Store } from "vuex";
import { inject, injectable } from "inversify";
import { Symbols } from "@/di";
import AppState from "@/store/AppState";

@injectable()
export default class PasteCommand extends BaseCommand implements Command {
  private store: Store<AppState>;

  constructor(@inject(Symbols.Store) store: Store<AppState>) {
    super("paste", "Paste", mdiContentPaste);

    this.store = store;
  }

  public async action(): Promise<void> {
    if (!this.selectedTab) {
      return;
    }

    const text = await navigator.clipboard.readText();

    const session = this.selectedTab.session;
    const range = session.getSelection().getRange();

    session.replace(range, text);
  }

  public get isDisabled(): boolean {
    return false;
  }

  private get selectedTab(): Tab | null {
    return this.store.getters["tabs/selected"] as Tab | null;
  }
}
