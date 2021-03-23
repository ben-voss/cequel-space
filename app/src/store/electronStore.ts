import Vue from "vue";
import Vuex, { Module, Store } from "vuex";
import AppState from "./AppState";
import { ConnectionsState } from "./modules/Connections";
import { SchemaState } from "./modules/Schema";
import { TabsState } from "./modules/Tabs";

Vue.use(Vuex);

export default function storeFactory(
  connections: Module<ConnectionsState, AppState>,
  schema: Module<SchemaState, AppState>,
  tabs: Module<TabsState, AppState>
  ): Store<AppState> {

  const store = new Vuex.Store<AppState>({
    modules: {
      connections,
      schema,
      tabs
    }
  });

  // Load the connections as soon as we can
  window.addEventListener("load", () => {
    store.dispatch("connections/load", {});
  });

  // When the selected connection changes the schema is loaded
  store.watch(
    (_state, getters) => getters["connections/selected"],
    () => {
      store.dispatch("schema/load", {});
    }
  );

  return store;
}
