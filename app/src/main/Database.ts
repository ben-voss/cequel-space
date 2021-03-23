import Connection from "@/model/Connection";
import RecordSet from "@/model/RecordSet";
import {
  Connection as TdsConnection,
  ConnectionConfig,
  Request
} from "tedious";

export default class Database {
  private isCancelled = false;
  private tdsConnection: TdsConnection;
  private task: Promise<RecordSet[] | string | number | null> | null = null;

  constructor(connection: Connection) {
    const config: ConnectionConfig = {
      server: connection.hostName,
      options: {
        port: connection.port ? connection.port : undefined,
        database: connection.database ? connection.database : undefined,
        encrypt: false
      },
      authentication: {
        type: "default",
        options: {
          userName: connection.username,
          password: connection.password
        }
      }
    };

    this.tdsConnection = new TdsConnection(config);

    this.tdsConnection.on("infoMessage", m => {
      //console.log(m);
    });

    this.tdsConnection.on("errorMessage", m => {
      console.log("ERROR " + m);
    });
  }

  public cancel(): void {
    this.isCancelled = true;

    try {
      this.tdsConnection.cancel();
    } catch {
      //
    }
  }

  public beginExecScalar(query: string): void {
    this.task = this.execScalarAsync(query);
  }

  public async endExecScalarAsync(): Promise<string | number | null> {
    if (!this.task) {
      return null;
    }

    return (await this.task) as string | number | null;
  }

  private async execScalarAsync(
    query: string
  ): Promise<string | number | null> {
    const results = await this.execRecordSetAsync(query);

    if (this.isCancelled) {
      return null;
    }

    if (!results) {
      return null;
    }

    if (results.length < 1) {
      return null;
    }

    if (!results[0].data) {
      return null;
    }

    if (results[0].data.length < 0) {
      return null;
    }

    return results[0].data[0][0];
  }

  public beginExecRecordSet(query: string): void {
    this.task = this.execRecordSetAsync(query);
  }

  public async endExecRecordsetAsync(): Promise<RecordSet[] | null> {
    if (!this.task) {
      return null;
    }

    return (await this.task) as RecordSet[] | null;
  }

  private async execRecordSetAsync(query: string): Promise<RecordSet[] | null> {
    try {
      await this.connectAsync();

      if (this.isCancelled) {
        return null;
      }

      return await this.execAsync(query);
    } finally {
      try {
        this.tdsConnection.close();
      } catch {
        //
      }
    }
  }

  private connectAsync(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.tdsConnection.connect(e => {
          if (e) {
            reject(e);
          } else {
            resolve();
          }
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  private execAsync(sqlQuery: string): Promise<RecordSet[]> {
    return new Promise((resolve, reject) => {
      try {
        const result: RecordSet[] = [];
        let currentResult: RecordSet | undefined;

        // Read all rows from table
        const request = new Request(sqlQuery, err => {
          if (err) {
            if (err.message) {
              reject(err.message);
            }
            reject(err);
          }
        });

        request.on("error", err => {
          result.push({
            message: err.message,
            headers: undefined,
            data: undefined
          });
        });

        request.on("columnMetadata", columns => {
          currentResult = {
            message: undefined,
            headers: columns.map(c => c.colName),
            data: []
          };
        });

        request.on("row", columns => {
          if (currentResult && currentResult.data) {
            currentResult.data.push(columns.map(c => c.value));
          }
        });

        request.on("done", () => {
          if (currentResult) {
            result.push(currentResult);
            currentResult = undefined;
          }
        });

        request.on("doneInProc", () => {
          if (currentResult) {
            result.push(currentResult);
            currentResult = undefined;
          }
        });

        request.on("doneProc", () => {
          if (currentResult) {
            result.push(currentResult);
            currentResult = undefined;
          }
        });

        request.on("requestCompleted", () => {
          resolve(result);
        });

        this.tdsConnection.on("infoMessage", message => {
          if (message.number == 0) {
            result.push({
              message: message.message,
              headers: undefined,
              data: undefined
            });
          }
        });

        this.tdsConnection.execSql(request);
      } catch (error) {
        reject(error);
      }
    });
  }
}
