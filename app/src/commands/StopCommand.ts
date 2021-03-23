import { mdiStopCircleOutline } from "@mdi/js";
import Tab from "@/model/Tab";
import Command from "./Command";
import BaseCommand from "./BaseCommand";
import { Store } from "vuex";
import { inject, injectable } from "inversify";
import { Symbols } from "@/di";
import AppState from "@/store/AppState";

@injectable()
export default class StopCommand extends BaseCommand implements Command {
  private store: Store<AppState>;

  constructor(@inject(Symbols.Store) store: Store<AppState>) {
    super("stop", "Stop", mdiStopCircleOutline);

    this.store = store;
  }

  public action(): void {
    this.selectedTab?.stop();
  }

  public get isDisabled(): boolean {
    if (!this.selectedTab) {
      return true;
    }

    return this.selectedTab?.stopDisabled;
  }

  private get selectedTab(): Tab | null {
    return this.store.getters["tabs/selected"] as Tab | null;
  }
}
