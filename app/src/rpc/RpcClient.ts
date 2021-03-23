import { ResponseMessage } from "./ResponseMessage";
import { v1 as uuid } from "uuid";
import { injectable } from "inversify";

class DeferredPromise {
  public promise: Promise<any>;
  public resolve!: (value?: any) => void;
  public reject!: (reason?: any) => void;

  constructor() {
    this.promise = new Promise((resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;
    });
  }
}

@injectable()
export default class RpcClient {
  private handleResponseEvent = (
    event: Electron.IpcRendererEvent,
    json: string
  ) => this.handleResponse(event, json);
  private promises = new Map<string, DeferredPromise>();
  private target: string;

  constructor(target: string) {
    this.target = target;

    window.ipcRenderer.on("RPC_RESPONSE", this.handleResponseEvent);
  }

  public dispose() {
    window.ipcRenderer.removeListener("RPC_RESPONSE", this.handleResponseEvent);
  }

  public call<T>(method: string, ...args: any): Promise<T> {
    const id = uuid();
    const promise = new DeferredPromise();

    this.promises.set(id, promise);

    window.ipcRenderer.send(
      "RPC",
      JSON.stringify({ id, target: this.target, method, args })
    );

    return promise.promise;
  }

  private handleResponse(
    _event: Electron.IpcRendererEvent,
    json: string
  ): void {
    const response = JSON.parse(json) as ResponseMessage;

    const promise = this.promises.get(response.id);
    if (promise) {
      this.promises.delete(response.id);

      if (response.success) {
        promise.resolve(response.result);
      } else {
        promise.reject();
      }
    }
  }
}
