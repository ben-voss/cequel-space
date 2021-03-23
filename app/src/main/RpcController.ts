import Connection from "@/model/Connection";
import RpcServer from "@/rpc/RpcServer";
import ConnectionsService from "./ConnectionService";
import ConnectionTestService from "./ConnectionTestService";
import SqlService from "./SqlService";
import fs from "fs";
import util from "util";
import { app, BrowserWindow, dialog } from "electron";
import path from "path";
import BatchJob from "@/model/BatchJob";
import MessageBoxOptions from "@/api/MessageBoxOptions";

const writeFileAsync = util.promisify(fs.writeFile);
const readFileAsync = util.promisify(fs.readFile);

export default class RpcController {
  private connectionService = new ConnectionsService();
  private sqlService = new SqlService(this.connectionService);
  private connectionTestService = new ConnectionTestService();

  private rpcServer: RpcServer;

  constructor() {
    // Setup the RPC server
    const functions = {
      getConnections: () => this.connectionService.get(),
      addConnection: (_: BrowserWindow, connection: Connection) =>
        this.connectionService.add(connection),
      updateConnection: (_: BrowserWindow, connection: Connection) =>
        this.connectionService.update(connection),
      deleteConnection: (_: BrowserWindow, connectionId: string) =>
        this.connectionService.delete(connectionId),
      startConnectionTest: (_: BrowserWindow, connection: Connection) =>
        this.connectionTestService.start(connection),
      getConnectionTest: (_: BrowserWindow, id: string) =>
        this.connectionTestService.getResult(id),
      cancelConnectionTest: (_: BrowserWindow, id: string) =>
        this.connectionTestService.cancel(id),
      addBatchJob: (_: BrowserWindow, batchJob: BatchJob) =>
        this.sqlService.add(batchJob),
      getBatchJob: (_: BrowserWindow, id: string) => this.sqlService.get(id),
      deleteBatchJob: (_: BrowserWindow, id: string) =>
        this.sqlService.delete(id),

      messageBox: async (
        browserWindow: BrowserWindow,
        options: MessageBoxOptions
      ) => await this.messageBox(browserWindow, options),
      save: async (_: BrowserWindow, fileName: string, content: string) =>
        await writeFileAsync(fileName, content),
      saveAs: async (
        browserWindow: BrowserWindow,
        content: string,
        contentType: string
      ) => await this.saveAs(browserWindow, content, contentType),
      open: async (browserWindow: BrowserWindow) =>
        await this.open(browserWindow),
      setRepresentedFilename: async (
        browserWindow: BrowserWindow,
        fileName: string
      ) => await this.setRepresentedFilename(browserWindow, fileName)
    };

    this.rpcServer = new RpcServer(functions, "MAIN");
  }

  private async setRepresentedFilename(
    browserWindow: BrowserWindow,
    fileName: string
  ): Promise<void> {
    if (fileName) {
      browserWindow.title = path.basename(fileName) + " - " + app.name;
      browserWindow.setRepresentedFilename(fileName);
    } else {
      browserWindow.title = app.name;
      browserWindow.setRepresentedFilename("");
    }
  }

  private async open(
    browserWindow: BrowserWindow
  ): Promise<{ name: string; content: string } | null> {
    const r = await dialog.showOpenDialog(browserWindow, {
      properties: ["openFile"],
      filters: [{ name: "Query Files", extensions: ["sql"] }]
    });

    if (r.canceled || r.filePaths.length === 0) {
      return null;
    }

    const content = await readFileAsync(r.filePaths[0]);

    return {
      name: r.filePaths[0],
      content: content.toString()
    };
  }

  private async saveAs(
    browserWindow: BrowserWindow,
    content: string,
    contentType: string
  ): Promise<string | null> {
    const result = await dialog.showSaveDialog(browserWindow, {
      properties: [],
      filters: [{ name: "Query Files", extensions: [contentType] }]
    });

    if (result.canceled || !result.filePath) {
      return null;
    }

    await writeFileAsync(result.filePath, content);

    return result.filePath;
  }

  private async messageBox(
    browserWindow: BrowserWindow,
    options: MessageBoxOptions
  ): Promise<number> {
    const response = await dialog.showMessageBox(browserWindow, options);

    return response.response;
  }
}
