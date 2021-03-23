import container, { Symbols } from "@/di";
import Tab from "@/model/Tab";
import { Module } from "vuex";
import AppState from "../AppState";

export interface TabsState {
  tabs: Tab[];
  selectedIndex: number;
}

export default function tabsStateFactory(): Module<TabsState, AppState> {
  return {
    namespaced: true,
    state: {
      tabs: [],
      selectedIndex: -1
    },
    getters: {
      selected(state): Tab | null {
        if (
          state.selectedIndex >= 0 &&
          state.selectedIndex < state.tabs.length
        ) {
          return state.tabs[state.selectedIndex];
        }

        return null;
      }
    },
    mutations: {
      load(state, tabs: Tab[]): void {
        state.tabs.splice(0, state.tabs.length, ...tabs);
        if (state.selectedIndex === -1 && state.tabs.length > 0) {
          state.selectedIndex = 0;
        }
      },
      add(state, tab: Tab): void {
        state.selectedIndex = state.tabs.push(tab) - 1;
      },
      update(state, tab: Tab): void {
        const index = state.tabs.findIndex(c => c.id === tab.id);
        console.assert(index >= 0);
        state.tabs.splice(index, 1, tab);
      },
      delete(state, tab: Tab): void {
        const index = state.tabs.findIndex(c => c.id === tab.id);
        console.assert(index >= 0);
        state.tabs.splice(index, 1);

        if (state.selectedIndex > state.tabs.length - 1) {
          state.selectedIndex = state.tabs.length - 1;
        }
      },
      setSelectedIndex(state, tabIndex: number): void {
        state.selectedIndex = tabIndex;
      }
    },
    actions: {
      async load(context): Promise<Tab[]> {
        const tabFactory = container.get(Symbols.TabFactory) as () => Tab;
        const tabs = [tabFactory()];
        context.commit("load", tabs);
        return tabs;
      },
      async add(context, args: { tab: Tab }): Promise<Tab> {
        context.commit("add", args.tab);
        return args.tab;
      },
      async update(context, args: { tab: Tab }): Promise<void> {
        context.commit("update", args.tab);
      },
      async delete(context, args: { tab: Tab }): Promise<void> {
        context.commit("delete", args.tab);
      },
      async setSelectedIndex(context, args: { index: number }): Promise<void> {
        context.commit("setSelectedIndex", args.index);
      }
    }
  };
}
