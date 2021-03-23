import { mdiPlusCircleOutline } from "@mdi/js";
import Tab from "@/model/Tab";
import Command from "./Command";
import BaseCommand from "./BaseCommand";
import { Store } from "vuex";
import { inject, injectable } from "inversify";
import { Symbols } from "@/di";
import Api from "@/api/Api";
import AppState from "@/store/AppState";

@injectable()
export default class NewCommand extends BaseCommand implements Command {
  private readonly store: Store<AppState>;
  private readonly api: Api;
  private readonly tabFactory: () => Tab;

  constructor(
    @inject(Symbols.Store) store: Store<AppState>,
    @inject(Symbols.Api) api: Api,
    @inject(Symbols.TabFactory) tabFactory: () => Tab
  ) {
    super("new", "New", mdiPlusCircleOutline);

    this.store = store;
    this.api = api;
    this.tabFactory = tabFactory;
  }

  public action(): void {
    this.store.dispatch("tabs/add", { tab: this.tabFactory() });
  }

  public get isDisabled(): boolean {
    return false;
  }
}
