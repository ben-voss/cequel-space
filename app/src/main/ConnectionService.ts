import Connection from "@/model/Connection";
import { v1 as uuid } from "uuid";
import Store from "electron-store";

export default class ConnectionsService {
  private store = new Store();
  private connections: Map<string, Connection>;

  constructor() {
    const connections = this.store.get("connections") as
      | Connection[]
      | undefined;

    if (!connections) {
      this.connections = new Map<string, Connection>();
    } else {
      this.connections = new Map<string, Connection>(
        connections.map(c => [c.id as string, c])
      );
    }
  }

  public get(): Connection[] {
    return Array.from(this.connections.values());
  }

  public getById(id: string): Connection | undefined {
    return this.connections.get(id);
  }

  public add(connection: Connection): string {
    const id = uuid();
    connection.id = id;
    this.connections.set(id, connection);

    this.save();

    return id;
  }

  public update(connection: Connection): void {
    if (connection.id) {
      this.connections.set(connection.id, connection);
      this.save();
    }
  }

  public delete(connectionId: string): void {
    this.connections.delete(connectionId);
    this.save();
  }

  private save() {
    this.store.set("connections", Array.from(this.connections.values()));
  }
}
