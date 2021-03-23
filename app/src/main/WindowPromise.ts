import { BrowserWindow } from "electron";

export default class WindowPromise {
  private window: BrowserWindow;
  public promise: Promise<BrowserWindow>;
  public resolve!: (value: BrowserWindow) => void;
  public reject!: (reason?: any) => void;

  constructor(window: BrowserWindow) {
    this.window = window;

    this.promise = new Promise((resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;
    });
  }
}
