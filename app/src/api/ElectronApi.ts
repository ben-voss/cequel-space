import { Symbols } from "@/di";
import BatchJob from "@/model/BatchJob";
import Connection from "@/model/Connection";
import ConnectionTestResult from "@/model/ConnectionTestResult";
import RecordSet from "@/model/RecordSet";
import RpcClient from "@/rpc/RpcClient";
import { inject, injectable } from "inversify";
import Api from "./Api";
import FileInfo from "./FileInfo";
import MessageBoxOptions from "./MessageBoxOptions";

@injectable()
export default class RpcApi implements Api {
  private rpcClient: RpcClient;

  constructor(@inject(Symbols.RpcClient) rpcClient: RpcClient) {
    this.rpcClient = rpcClient;
  }

  public getConnections(): Promise<Connection[]> {
    return this.rpcClient.call("getConnections");
  }

  public async addConnection(connection: Connection): Promise<Connection> {
    const id = await this.rpcClient.call<string>("addConnection", connection);
    connection.id = id;
    return connection;
  }

  public updateConnection(connection: Connection): Promise<void> {
    return this.rpcClient.call("updateConnection", connection);
  }

  public deleteConnection(id: string): Promise<void> {
    return this.rpcClient.call("deleteConnection", id);
  }

  public async startConnectionTest(connection: Connection): Promise<string> {
    return this.rpcClient.call<string>("startConnectionTest", connection);
  }

  public async getConnectionTest(id: string): Promise<ConnectionTestResult> {
    return this.rpcClient.call<ConnectionTestResult>("getConnectionTest", id);
  }

  public async cancelConnectionTest(id: string): Promise<void> {
    return this.rpcClient.call("cancelConnectionTest", id);
  }

  public async addBatchJob(batchJob: BatchJob): Promise<BatchJob> {
    const id = await this.rpcClient.call<string>("addBatchJob", batchJob);
    batchJob.id = id;
    return batchJob;
  }

  public getBatchJob(id: string): Promise<RecordSet[]> {
    return this.rpcClient.call<RecordSet[]>("getBatchJob", id);
  }

  public deleteBatchJob(id: string): Promise<void> {
    return this.rpcClient.call("deleteBatchJob", id);
  }

  public messageBox(options: MessageBoxOptions): Promise<number> {
    return this.rpcClient.call("messageBox", options);
  }

  public save(
    fileName: string,
    fileContent: string,
    contentType: string
  ): Promise<void> {
    return this.rpcClient.call("save", fileName, fileContent, contentType);
  }

  public saveAs(fileContent: string, contentType: string): Promise<string> {
    return this.rpcClient.call("saveAs", fileContent, contentType);
  }

  public open(): Promise<FileInfo | null> {
    return this.rpcClient.call<FileInfo>("open");
  }

  public setRepresentedFilename(fileName: string | null): Promise<void> {
    return this.rpcClient.call("setRepresentedFilename", fileName);
  }
}
