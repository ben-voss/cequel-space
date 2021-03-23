import Connection from "@/model/Connection";
import ConnectionTestResult from "@/model/ConnectionTestResult";
import { v1 as uuid } from "uuid";
import Database from "./Database";

export default class ConnectionTestService {
  private tasks = new Map<string, Database>();

  public start(connection: Connection): string {
    const id = uuid();

    const task = new Database(connection);

    this.tasks.set(id, task);

    task.beginExecScalar("SELECT 42");

    return id;
  }

  public cancel(id: string): void {
    this.tasks.delete(id);
  }

  public async getResult(id: string): Promise<ConnectionTestResult> {
    const task = this.tasks.get(id);

    if (!task) {
      throw "Not Found";
    }

    try {
      const result = await task.endExecScalarAsync();

      return {
        result: result == 42,
        message: ""
      };
    } catch (error) {
      if (error.message) {
        return {
          result: false,
          message: error.message
        };
      }

      return {
        result: false,
        message: error
      };
    }
  }
}
