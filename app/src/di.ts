import getDecorators from "inversify-inject-decorators";
import { Container } from "inversify";
const container = new Container({ skipBaseClassChecks: true });

const { lazyInject } = getDecorators(container);
export { lazyInject as LazyInject };

export default container;

export const Symbols = {
  OidcSettings: Symbol.for("OidcSettings"),

  RpcClient: Symbol.for("RpcClient"),
  Store: Symbol.for("Store<AppState>"),
  OidcState: Symbol.for("OidcState"),
  ConnectionsState: Symbol.for("ConnectionsState"),
  SchemaState: Symbol.for("SchemaState"),
  TabsState: Symbol.for("TabsState"),

  Api: Symbol.for("Api"),
  Router: Symbol.for("Router"),

  TabFactory: Symbol.for("Factory<Tab>"),
  ColumnNodeFactory: Symbol.for("Factory<ColumnNode>"),
  ProcedureNodeFactory: Symbol.for("Factory<ProcedureNode>"),
  TableNodeFactory: Symbol.for("Factory<TableNode>"),
  TriggerNodeFactory: Symbol.for("Factory<TriggerNode>"),
  ViewNodeFactory: Symbol.for("Factory<ViewNode>"),

  NewCommand: Symbol.for("NewCommand"),
  OpenCommand: Symbol.for("OpenCommand"),
  SaveCommand: Symbol.for("SaveCommand"),
  SaveAsCommand: Symbol.for("SaveAsCommand"),
  RunCommand: Symbol.for("RunCommand"),
  StopCommand: Symbol.for("StopCommand"),
  ExportCommand: Symbol.for("ExportCommand"),
  CutCommand: Symbol.for("CutCommand"),
  CopyCommand: Symbol.for("CopyCommand"),
  PasteCommand: Symbol.for("PasteCommand"),
  UndoCommand: Symbol.for("UndoCommand"),
  RedoCommand: Symbol.for("RedoCommand"),
  ConnectionsCommand: Symbol.for("ConnectionsCommand"),
  CloseSelectedEditorCommand: Symbol.for("CloseSelectedEditorCommand"),
  SettingsCommand: Symbol.for("SettingsCommand")
};
