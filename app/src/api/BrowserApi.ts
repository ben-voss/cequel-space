import { Symbols } from "@/di";
import BatchJob from "@/model/BatchJob";
import Connection from "@/model/Connection";
import ConnectionTestResult from "@/model/ConnectionTestResult";
import Identifiable from "@/model/Identifiable";
import RecordSet from "@/model/RecordSet";
import { BrowserState } from "@/store/browserStore";
import axios, { AxiosInstance, CancelToken, CancelTokenSource } from "axios";
import { inject, injectable } from "inversify";
import Vue from "vue";
import { Store } from "vuex";
import Api from "./Api";
import FileInfo from "./FileInfo";
import MessageBoxOptions from "./MessageBoxOptions";

@injectable()
export default class BrowserApi implements Api {
  private axios: AxiosInstance;
  private cancelTokens = new Map<string, CancelTokenSource>();

  constructor(@inject(Symbols.Store) store: Store<BrowserState>) {
    this.axios = axios.create({
      withCredentials: true,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: "Bearer " + store.state.oidcStore.id_token
      }
    });
  }

  private async get<T>(controller: string): Promise<T> {
    try {
      const result = await this.axios.get("api/v1/" + controller);

      return result.data as T;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  private async getById<T>(
    controller: string,
    id: string,
    cancelToken?: CancelToken
  ): Promise<T> {
    try {
      const result = await this.axios.get("api/v1/" + controller + "/" + id, {
        cancelToken: cancelToken
      });

      return result.data as T;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  private async post<T extends Identifiable>(
    controller: string,
    data: T
  ): Promise<T> {
    try {
      const result = await this.axios.post("api/v1/" + controller, data);

      data.id = result.data;
      return data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  private async put<T>(controller: string, data: T): Promise<void> {
    try {
      await this.axios.put("api/v1/" + controller, data);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  private async delete(controller: string, id: string): Promise<void> {
    try {
      await this.axios.delete("api/v1/" + controller + "/" + id);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  public getConnections(): Promise<Connection[]> {
    return this.get("connections");
  }

  public addConnection(connection: Connection): Promise<Connection> {
    return this.post<Connection>("connections", connection);
  }

  public updateConnection(connection: Connection): Promise<void> {
    return this.put("connections", connection);
  }

  public deleteConnection(id: string): Promise<void> {
    return this.delete("connections", id);
  }

  public async startConnectionTest(connection: Connection): Promise<string> {
    try {
      const result = await this.axios.post("api/v1/ConnectionTest", connection);

      return result.data as string;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  public async getConnectionTest(id: string): Promise<ConnectionTestResult> {
    const tokenSource = axios.CancelToken.source();
    this.cancelTokens.set(id, tokenSource);

    try {
      const result = await this.axios.get("api/v1/ConnectionTest/" + id, {
        cancelToken: tokenSource.token
      });

      return result.data as ConnectionTestResult;
    } catch (error) {
      throw this.handleError(error);
    } finally {
      this.cancelTokens.delete(id);
    }
  }

  public async cancelConnectionTest(id: string): Promise<void> {
    const cancelTokenSource = this.cancelTokens.get(id);
    if (cancelTokenSource) {
      cancelTokenSource.cancel("Operation cancelled by user");
    }

    return this.delete("ConnectionTest", id);
  }

  public addBatchJob(batchJob: BatchJob): Promise<BatchJob> {
    return this.post("Sql", batchJob);
  }

  public async getBatchJob(id: string): Promise<RecordSet[]> {
    const tokenSource = axios.CancelToken.source();
    this.cancelTokens.set(id, tokenSource);

    try {
      const result = await this.axios.get("api/v1/Sql/" + id, {
        cancelToken: tokenSource.token
      });

      return result.data as RecordSet[];
    } catch (error) {
      // Ignore errors caused by cancelling the request.
      if (!axios.isCancel(error)) {
        return [];
      }

      throw this.handleError(error);
    } finally {
      this.cancelTokens.delete(id);
    }
  }

  public deleteBatchJob(id: string): Promise<void> {
    const cancelTokenSource = this.cancelTokens.get(id);
    if (cancelTokenSource) {
      cancelTokenSource.cancel("Operation cancelled by user");
    }

    return this.delete("Sql", id);
  }

  private handleError(error: any): string {
    let errorMessage = error.response.data.message;
    if (!errorMessage) {
      errorMessage = error.response.data;

      if (!errorMessage) {
        errorMessage = error.response;

        if (!errorMessage) {
          errorMessage = error;
        }
      }
    }

    return errorMessage;
  }

  public async messageBox(options: MessageBoxOptions): Promise<number> {
    alert(options.message);

    return 0;
  }

  public async save(
    fileName: string,
    fileContent: string,
    contentType: string
  ): Promise<void> {
    // Set the content type and encode the entire download into a href
    fileContent =
      "data:application/" + contentType + "," + encodeURIComponent(fileContent);

    const x = document.createElement("A");
    x.setAttribute("href", fileContent);
    x.setAttribute("download", fileName);

    // Add the href and click it to invoke the download
    document.body.appendChild(x);
    x.click();

    // Cleanup the node
    return Vue.nextTick(() => document.body.removeChild(x));
  }

  public async saveAs(
    fileContent: string,
    contentType: string
  ): Promise<string> {
    const fileName = "file." + contentType;
    await this.save(fileName, fileContent, contentType);
    return fileName;
  }

  public open(): Promise<FileInfo | null> {
    return new Promise<FileInfo | null>((resolve, reject) => {
      try {
        const fileInput = document.createElement("input");
        fileInput.type = "file";
        fileInput.accept = ".sql,*.txt";
        fileInput.style.display = "none";
        fileInput.onchange = (e: Event) => {
          const files = (e.target as HTMLInputElement).files;
          if (!files || files.length === 0) {
            resolve(null);
            return;
          }

          const file = files[0];
          if (!file) {
            resolve(null);
            return;
          }

          const reader = new FileReader();
          reader.onload = (e: Event) => {
            const content = (e.target as FileReader).result as string;
            resolve({ name: file.name, content });
            document.body.removeChild(fileInput);
          };

          reader.readAsText(file);
        };

        document.body.appendChild(fileInput);
        fileInput.click();
      } catch (e) {
        reject(e);
      }
    });
  }

  public async setRepresentedFilename(fileName: string | null): Promise<void> {
    if (fileName === null) {
      document.title = "Cequel.Space";
    } else {
      document.title = "Cequel.Space - " + fileName;
    }
  }
}
