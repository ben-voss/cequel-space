import Api from "@/api/Api";
import container, { Symbols } from "@/di";
import { Module } from "vuex";
import Connection from "../../model/Connection";
import AppState from "../AppState";

export interface ConnectionsState {
  loaded: boolean;
  connections: Connection[];
  selectedIndex: number;
}

export default function connectionsStateFactory(): Module<ConnectionsState, AppState> {
  return {
    namespaced: true,
    state: {
      loaded: false,
      connections: [],
      selectedIndex: -1
    },
    getters: {
      selected(state): Connection | null {
        if (
          state.selectedIndex >= 0 &&
          state.selectedIndex < state.connections.length
        ) {
          return state.connections[state.selectedIndex];
        }

        return null;
      }
    },
    mutations: {
      load(state, connections: Connection[]): void {
        state.connections.splice(0, state.connections.length, ...connections);
        if (state.selectedIndex === -1 && state.connections.length > 0) {
          state.selectedIndex = 0;
        }

        state.loaded = true;
      },
      add(state, connection: Connection): void {
        state.connections.push(connection);
      },
      update(state, connection: Connection): void {
        const index = state.connections.findIndex(c => c.id === connection.id);
        console.assert(index >= 0);
        state.connections.splice(index, 1, connection);
      },
      delete(state, connection: Connection): void {
        const index = state.connections.findIndex(c => c.id === connection.id);
        console.assert(index >= 0);
        state.connections.splice(index, 1);

        if (state.selectedIndex > state.connections.length - 1) {
          state.selectedIndex = state.connections.length - 1;
        }
      },
      setSelectedIndex(state, index: number): void {
        state.selectedIndex = index;
      }
    },
    actions: {
      async load(context): Promise<Connection[]> {
        const connections = await (container.get(Symbols.Api) as Api).getConnections();
        context.commit("load", connections);
        return connections;
      },
      async add(context, args: { connection: Connection }): Promise<Connection> {
        const connection = await (container.get(Symbols.Api) as Api).addConnection(args.connection);
        context.commit("add", connection);
        return connection;
      },
      async update(context, args: { connection: Connection }): Promise<void> {
        await (container.get(Symbols.Api) as Api).updateConnection(args.connection);
        context.commit("update", args.connection);
      },
      async delete(context, args: { connection: Connection }): Promise<void> {
        await (container.get(Symbols.Api) as Api).deleteConnection(args.connection.id!);
        context.commit("delete", args.connection);
      },
      async setSelectedIndex(context, args: { index: number }): Promise<void> {
        context.commit("setSelectedIndex", args.index);
      }
    }
  };
}
