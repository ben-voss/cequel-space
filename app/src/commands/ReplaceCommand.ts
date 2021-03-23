import Tab from "@/model/Tab";
import Command from "./Command";
import BaseCommand from "./BaseCommand";
import { Editor } from "brace";
import { Store } from "vuex";
import { inject, injectable } from "inversify";
import { Symbols } from "@/di";
import AppState from "@/store/AppState";

@injectable()
export default class ReplaceCommand extends BaseCommand implements Command {
  private store: Store<AppState>;
  private editor: Editor;

  constructor(@inject(Symbols.Store) store: Store<AppState>, editor: Editor) {
    super("replace", "Replace", "");

    this.store = store;
    this.editor = editor;
  }

  public action(): void {
    this.editor.execCommand("replace");
  }

  public get isDisabled(): boolean {
    return this.selectedTab === null;
  }

  private get selectedTab(): Tab | null {
    return this.store.getters["tabs/selected"] as Tab | null;
  }
}
