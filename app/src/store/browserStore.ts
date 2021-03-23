import Vue from "vue";
import Vuex, { Module, Store } from "vuex";
import { VuexOidcState } from "vuex-oidc";
import { ConnectionsState } from "./modules/Connections";
import { SchemaState } from "./modules/Schema";
import { TabsState } from "./modules/Tabs";
import AppState from "./AppState";

Vue.use(Vuex);

export interface BrowserState extends AppState {
  oidcStore: VuexOidcState;
}

export default function storeFactory(
  oidcStore: Module<VuexOidcState, AppState>,
  connections: Module<ConnectionsState, AppState>,
  schema: Module<SchemaState, AppState>,
  tabs: Module<TabsState, AppState>
): Store<BrowserState> {
  const store = new Vuex.Store<BrowserState>({
    modules: {
      oidcStore,
      connections,
      schema,
      tabs
    }
  });

  // When we are authenticated we load the connections
  store.watch(
    (_state, getters) => getters["oidcStore/oidcIsAuthenticated"],
    async (oidcIsAuthenticated: boolean) => {
      if (oidcIsAuthenticated) {
        try {
          await store.dispatch("connections/load", {});
        } catch (error) {
          console.error(error);
        }
      }
    }
  );

  // When the selected connection changes the schema is loaded
  store.watch(
    (_state, getters) => getters["connections/selected"],
    async () => {
      try {
        await store.dispatch("schema/load", {});
      } catch (error) {
        console.error(error);
      }
    }
  );

  return store;
}
