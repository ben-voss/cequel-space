import { ConnectionsState } from "./modules/Connections";
import { SchemaState } from "./modules/Schema";
import { TabsState } from "./modules/Tabs";

export default interface AppState {
  connections: ConnectionsState;
  schema: SchemaState;
  tabs: TabsState;
}
