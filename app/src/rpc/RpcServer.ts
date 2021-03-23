import { BrowserWindow, ipcMain } from "electron";
import { RequestMessage } from "./RequestMessage";
import { ResponseMessage } from "./ResponseMessage";

export default class RpcServer {
  constructor(
    functions: { [methodName: string]: (...args: any) => any },
    scope: string
  ) {
    // If the scope is correct, we attempt to run the corresponding
    // function in the function lib.
    ipcMain.on("RPC", (event, json) => {
      const sendingWindow = BrowserWindow.fromWebContents(event.sender);
      if (!sendingWindow) {
        return;
      }

      const request: RequestMessage = JSON.parse(json);

      if (scope === request.target) {
        const { id, method, args } = request;

        // Create reject/resolve functions
        const resolve = (result: any) => {
          this.ipcSend("RPC_RESPONSE", {
            success: true,
            id,
            result
          });
        };

        const reject = (result: any) => {
          this.ipcSend("RPC_RESPONSE", {
            success: false,
            id,
            result
          });
        };

        const functionFromAlias = functions[method];
        // If we have a function, run it.
        if (functionFromAlias) {
          // Run the function and get the result
          const result = functionFromAlias(sendingWindow, ...args);

          // We wrap the result in Promise.resolve so we can treat
          // it like a promise (even if is not a promise);
          Promise.resolve(result)
            .then(resolve)
            .catch(reject);
        } else {
          reject({ error: "Function not found." });
        }
      }
    });
  }

  private ipcSend(event: string, response: ResponseMessage): void {
    const json = JSON.stringify(response);
    const openWindows = BrowserWindow.getAllWindows();

    openWindows.forEach(({ webContents }) => {
      webContents.send(event, json);
    });
  }
}
