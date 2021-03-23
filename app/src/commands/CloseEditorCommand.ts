import Tab from "@/model/Tab";
import Command from "./Command";
import CloseSelectedEditorCommand from "./CloseSelectedEditorCommand";
import { Store } from "vuex";
import { inject, injectable } from "inversify";
import { Symbols } from "@/di";
import AppState from "@/store/AppState";
import Api from "@/api/Api";

@injectable()
export default class CloseEditorCommand extends CloseSelectedEditorCommand
  implements Command {
  private tab: Tab;

  constructor(
    tab: Tab,
    @inject(Symbols.Api) api: Api,
    @inject(Symbols.Store) store: Store<AppState>
  ) {
    super(api, store);
    this.id = "closeEditor";

    this.tab = tab;
  }

  protected get selectedTab(): Tab | null {
    return this.tab;
  }
}
