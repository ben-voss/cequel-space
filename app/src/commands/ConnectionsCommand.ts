import { mdiLanPending } from "@mdi/js";
import Command from "./Command";
import BaseCommand from "./BaseCommand";
import { injectable } from "inversify";

@injectable()
export default class ConnectionsCommand extends BaseCommand implements Command {
  private func: () => void;

  constructor(func: () => void) {
    super("connections", "Connections", mdiLanPending);
    this.func = func;
  }

  public action(): void {
    this.func();
  }

  public get isDisabled(): boolean {
    return false;
  }
}
