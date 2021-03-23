import { mdiRedo } from "@mdi/js";
import Tab from "@/model/Tab";
import Command from "./Command";
import BaseCommand from "./BaseCommand";
import { Store } from "vuex";
import { inject, injectable } from "inversify";
import { Symbols } from "@/di";
import AppState from "@/store/AppState";

@injectable()
export default class RedoCommand extends BaseCommand implements Command {
  private store: Store<AppState>;

  constructor(@inject(Symbols.Store) store: Store<AppState>) {
    super("redo", "Redo", mdiRedo);

    this.store = store;
  }

  public ipcRendererAction() {
    const activeElement = window.document.activeElement;

    // Workaround an issue sending undo/redo commands to the Ace editor.
    // The browser execCommand doesn't have any effect on Ace so we detect
    // when it has the input focus and invoke the undo operation on its
    // undo manager directly.
    if (
      activeElement &&
      activeElement.localName == "textarea" &&
      activeElement.className == "ace_text-input"
    ) {
      this.selectedTab?.session.getUndoManager().redo(false);
    } else {
      window.document.execCommand("redo");
    }
  }

  public action(): void {
    if (!this.selectedTab) {
      return;
    }

    this.selectedTab.session.getUndoManager().redo(false);
  }

  public get isDisabled(): boolean {
    if (!this.selectedTab) {
      return true;
    }

    return !this.selectedTab.session.getUndoManager().hasRedo();
  }

  private get selectedTab(): Tab | null {
    return this.store.getters["tabs/selected"] as Tab | null;
  }
}
