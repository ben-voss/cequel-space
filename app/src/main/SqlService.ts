import { v1 as uuid } from "uuid";
import ConnectionsService from "./ConnectionService";
import RecordSet from "@/model/RecordSet";
import Database from "./Database";
import BatchJob from "@/model/BatchJob";

export default class SqlService {
  private readonly connectionsService: ConnectionsService;

  private tasks = new Map<string, Database>();

  constructor(connectionsService: ConnectionsService) {
    this.connectionsService = connectionsService;
  }

  public add(query: BatchJob): string {
    const connection = this.connectionsService.getById(query.connectionId);

    if (!connection) {
      return "";
    }

    const task = new Database(connection);
    const id = uuid();
    this.tasks.set(id, task);

    task.beginExecRecordSet(query.query);

    return id;
  }

  public async get(queryId: string): Promise<RecordSet[] | null> {
    const task = this.tasks.get(queryId);

    if (!task) {
      throw "Not Found";
    }

    try {
      return task.endExecRecordsetAsync();
    } catch (error) {
      if (error.message) {
        return error.message;
      } else {
        return error;
      }
    }
  }

  public delete(queryId: string) {
    const task = this.tasks.get(queryId);

    if (!task) {
      return;
    }

    task.cancel();
  }
}
