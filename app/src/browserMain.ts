import "reflect-metadata";
import Vue from "vue";
import App from "./App.vue";
import vuetify from "./plugins/vuetify";
import vueCookies from "vue-cookies";
import { ClientSideRowModelModule } from "@ag-grid-community/client-side-row-model";
import { ModuleRegistry } from "@ag-grid-community/core";

// Create the dependency injection container
import "./di";
import container, { Symbols } from "./di";
import NewCommand from "./commands/NewCommand";
import OpenCommand from "./commands/OpenCommand";
import SaveCommand from "./commands/SaveCommand";
import RunCommand from "./commands/RunCommand";
import SaveAsCommand from "./commands/SaveAsCommand";
import StopCommand from "./commands/StopCommand";
import CutCommand from "./commands/CutCommand";
import ExportCommand from "./commands/ExportCommand";
import CopyCommand from "./commands/CopyCommand";
import PasteCommand from "./commands/PasteCommand";
import UndoCommand from "./commands/UndoCommand";
import RedoCommand from "./commands/RedoCommand";
import CloseSelectedEditorCommand from "./commands/CloseSelectedEditorCommand";
import storeFactory, { BrowserState } from "./store/browserStore";
import { BrowserRouter } from "./router/browserRouter";
import BrowserApi from "./api/BrowserApi";
import { interfaces } from "inversify";
import Tab from "./model/Tab";
import ColumnNode from "./model/nodes/ColumnNode";
import ProcedureNode from "./model/nodes/ProcedureNode";
import TableNode from "./model/nodes/TableNode";
import TriggerNode from "./model/nodes/TriggerNode";
import ViewNode from "./model/nodes/ViewNode";
import { Module, Store } from "vuex";
import oidcStateFactory from "./store/modules/Oidc";
import { VuexOidcClientSettings, VuexOidcState } from "vuex-oidc";
import connectionsStateFactory, { ConnectionsState } from "./store/modules/Connections";
import schemaStateFactory, { SchemaState } from "./store/modules/Schema";
import tabsStateFactory, { TabsState } from "./store/modules/Tabs";
import AppState from "./store/AppState";

(async () => {
  // Load config
  const defaultOidcSettings = {
    redirectUri: window.location.origin + "/oidc-callback",
    silentRedirectUri: window.location.origin + "/oidc-silent-renew.html",
    scope: "openid profile email",
    responseType: "code",
    automaticSilentRenew: true,
    automaticSilentSignin: true,
    filterProtocolClaims: true
  };

  const config = await fetch("/config.json");
  const oidcSettings: VuexOidcClientSettings = { ...defaultOidcSettings, ...(await config.json()) };

  container.bind(Symbols.OidcSettings).toConstantValue(oidcSettings);

  // Register the dependencies
  container
    .bind(Symbols.Api)
    .to(BrowserApi)
    .inSingletonScope();

  container
    .bind<Store<BrowserState>>(Symbols.Store)
    .toDynamicValue((context: interfaces.Context) => {
      return storeFactory(
        context.container.get(Symbols.OidcState),
        context.container.get(Symbols.ConnectionsState),
        context.container.get(Symbols.SchemaState),
        context.container.get(Symbols.TabsState)
      );
    })
    .inSingletonScope();

  container
    .bind<Module<VuexOidcState, AppState>>(Symbols.OidcState)
    .toDynamicValue((context: interfaces.Context) => {
      return oidcStateFactory(context.container.get(Symbols.OidcSettings));
    })
    .inSingletonScope();

  container
    .bind<Module<ConnectionsState, AppState>>(Symbols.ConnectionsState)
    .toDynamicValue(() => {
      return connectionsStateFactory();
    })
    .inSingletonScope();

  container
    .bind<Module<SchemaState, AppState>>(Symbols.SchemaState)
    .toDynamicValue(() => {
      return schemaStateFactory();
    })
    .inSingletonScope();

  container
    .bind<Module<TabsState, AppState>>(Symbols.TabsState)
    .toDynamicValue(() => {
      return tabsStateFactory();
    })
    .inSingletonScope();

  container.bind(Symbols.Router).to(BrowserRouter).inSingletonScope();
  container.bind(Symbols.NewCommand).to(NewCommand).inSingletonScope();
  container.bind(Symbols.OpenCommand).to(OpenCommand).inSingletonScope();
  container.bind(Symbols.SaveCommand).to(SaveCommand).inSingletonScope();
  container.bind(Symbols.SaveAsCommand).to(SaveAsCommand).inSingletonScope();
  container.bind(Symbols.RunCommand).to(RunCommand).inSingletonScope();
  container.bind(Symbols.StopCommand).to(StopCommand).inSingletonScope();
  container.bind(Symbols.ExportCommand).to(ExportCommand).inSingletonScope();
  container.bind(Symbols.CutCommand).to(CutCommand).inSingletonScope();
  container.bind(Symbols.CopyCommand).to(CopyCommand).inSingletonScope();
  container.bind(Symbols.PasteCommand).to(PasteCommand).inSingletonScope();
  container.bind(Symbols.UndoCommand).to(UndoCommand).inSingletonScope();
  container.bind(Symbols.RedoCommand).to(RedoCommand).inSingletonScope();
  container.bind(Symbols.CloseSelectedEditorCommand).to(CloseSelectedEditorCommand).inSingletonScope();

  container
    .bind<interfaces.Factory<Tab>>(Symbols.TabFactory)
    .toFactory<Tab>((context: interfaces.Context) => {
      return () => {
        return new Tab(
          context.container.get(Symbols.Api),
          context.container.get(Symbols.Store)
        );
      };
    });

  container
    .bind<interfaces.Factory<ColumnNode>>(Symbols.ColumnNodeFactory)
    .toFactory<ColumnNode>((context: interfaces.Context) => {
      return (columnId: number, tableName: string, name: string) => {
        return new ColumnNode(
          context.container.get(Symbols.Api),
          context.container.get(Symbols.Store),
          context.container.get(Symbols.TabFactory),
          columnId,
          tableName,
          name
        );
      };
    });

  container
    .bind<interfaces.Factory<ProcedureNode>>(Symbols.ProcedureNodeFactory)
    .toFactory<ProcedureNode>((context: interfaces.Context) => {
      return (id: number, name: string) => {
        return new ProcedureNode(
          context.container.get(Symbols.Api),
          context.container.get(Symbols.Store),
          context.container.get(Symbols.TabFactory),
          id,
          name
        );
      };
    });

  container
    .bind<interfaces.Factory<TableNode>>(Symbols.TableNodeFactory)
    .toFactory<TableNode>((context: interfaces.Context) => {
      return (id: number, name: string) => {
        return new TableNode(
          context.container.get(Symbols.Api),
          context.container.get(Symbols.Store),
          context.container.get(Symbols.TabFactory),
          id,
          name
        );
      };
    });

  container
    .bind<interfaces.Factory<TriggerNode>>(Symbols.TriggerNodeFactory)
    .toFactory<TriggerNode>(() => {
      return (id: number, name: string) => {
        return new TriggerNode(id, name);
      };
    });

  container
    .bind<interfaces.Factory<ViewNode>>(Symbols.ViewNodeFactory)
    .toFactory<ViewNode>((context: interfaces.Context) => {
      return (id: number, name: string) => {
        return new ViewNode(
          context.container.get(Symbols.Api),
          context.container.get(Symbols.Store),
          context.container.get(Symbols.TabFactory),
          id,
          name
        );
      };
    });

  ModuleRegistry.registerModules([ClientSideRowModelModule]);

  Vue.config.productionTip = false;

  Vue.use(vueCookies);

  new Vue({
    router: container.get(Symbols.Router),
    store: container.get(Symbols.Store),
    vuetify,
    render: h => h(App)
  }).$mount("#app");
})();
