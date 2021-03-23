import { mdiCogOutline } from "@mdi/js";
import Command from "./Command";
import BaseCommand from "./BaseCommand";
import { injectable } from "inversify";

@injectable()
export default class UndoCommand extends BaseCommand implements Command {
  private func: () => void;

  constructor(func: () => void) {
    super("settings", "Settings", mdiCogOutline);
    this.func = func;
  }

  public action(): void {
    this.func();
  }

  public get isDisabled(): boolean {
    return false;
  }
}
