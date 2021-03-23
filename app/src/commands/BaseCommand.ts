import { IpcRendererEvent } from "electron";
import { unmanaged } from "inversify";

export default abstract class BaseCommand {
  public id: string;
  public title: string;
  public icon: string;

  private lastValue: boolean | undefined = undefined;

  constructor(
    @unmanaged() id: string,
    @unmanaged() title: string,
    @unmanaged() icon: string
  ) {
    this.id = id;
    this.title = title;
    this.icon = icon;

    if (window.ipcRenderer) {
      window.ipcRenderer.on(
        "menu." + this.id,
        (event: IpcRendererEvent, ...args: string[]) => {
          this.ipcRendererAction(args);
        }
      );
    }
  }

  public get disabled(): boolean {
    const value = this.isDisabled;

    if (value != this.lastValue) {
      this.lastValue = value;

      if (window.ipcRenderer) {
        window.ipcRenderer.send("MENU", this.id, value);
      }
    }

    return value;
  }

  protected abstract get isDisabled(): boolean;

  protected abstract action(): void;

  protected ipcRendererAction(args: string[]): void {
    this.action();
  }
}
