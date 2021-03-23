import BatchJob from "@/model/BatchJob";
import Connection from "@/model/Connection";
import ConnectionTestResult from "@/model/ConnectionTestResult";
import RecordSet from "@/model/RecordSet";
import { MessageBoxOptions } from "electron";
import FileInfo from "./FileInfo";

export default interface Api {
  getConnections(): Promise<Connection[]>;

  addConnection(connection: Connection): Promise<Connection>;

  updateConnection(connection: Connection): Promise<void>;

  deleteConnection(id: string): Promise<void>;

  startConnectionTest(connection: Connection): Promise<string>;

  getConnectionTest(id: string): Promise<ConnectionTestResult>;

  cancelConnectionTest(id: string): Promise<void>;

  addBatchJob(batchJob: BatchJob): Promise<BatchJob>;

  getBatchJob(id: string): Promise<RecordSet[]>;

  deleteBatchJob(id: string): Promise<void>;

  messageBox(options: MessageBoxOptions): Promise<number>;

  save(
    fileName: string,
    fileContent: string,
    contentType: string
  ): Promise<void>;

  saveAs(fileContent: string, contentType: string): Promise<string>;

  open(): Promise<FileInfo | null>;

  setRepresentedFilename(fileName: string | null): Promise<void>;
}
