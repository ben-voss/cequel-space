import "reflect-metadata";
import TabBar from "@/components/TabBar.vue";
import { createLocalVue, mount } from "@vue/test-utils";
import Vuetify from "vuetify";
import Vuex from "vuex";
import container, { Symbols } from "@/di";
import { mock } from "jest-mock-extended";
import Api from "@/api/Api";

import Vue from "vue";
Vue.use(Vuetify);

const localVue = createLocalVue();
localVue.use(Vuex);
localVue.use(Vuetify);

const vuetify = new Vuetify();

describe("TabBar", () => {
  let actions: any;
  let store: any;
  let state: any;

  beforeEach(() => {
    container.snapshot();

    actions = {
      delete: jest.fn(),
      setSelectedIndex: jest.fn()
    };

    state = {
      tabs: [
        {
          id: 1,
          name: "Tab 1",
          session: {
            getUndoManager: () => {
              return {
                isClean: () => {
                  return true;
                }
              };
            }
          }
        },
        {
          id: 2,
          name: "Tab 2",
          session: {
            getUndoManager: () => {
              return {
                isClean: () => {
                  return true;
                }
              };
            }
          }
        }
      ],
      selectedIndex: -1
    };

    store = new Vuex.Store({
      modules: {
        tabs: {
          namespaced: true,
          actions,
          state
        }
      }
    });
  });

  afterEach(() => {
    container.restore();
  });

  test("Binds to the selected index", async () => {
    state.selectedIndex = 1;
    const wrapper = mount(TabBar, { store, localVue, vuetify });

    await wrapper.vm.$nextTick();

    expect(wrapper.findAll(".v-tab")).toHaveLength(2);
    expect(
      wrapper
        .findAll(".v-tab")
        .at(1)
        .attributes()["aria-selected"]
    ).toBeTruthy();
  });

  test("Defaults to select the first tab", async () => {
    const wrapper = mount(TabBar, { store, localVue, vuetify });

    await wrapper.vm.$nextTick();
    expect(actions.setSelectedIndex).toBeCalledWith(
      expect.anything(),
      expect.objectContaining({ index: 0 })
    );
  });

  test("Updates selected index when tab is changed", async () => {
    const wrapper = mount(TabBar, { store, localVue, vuetify });
    await wrapper.vm.$nextTick();

    expect(wrapper.findAll(".v-tab")).toHaveLength(2);
    wrapper
      .findAll(".v-tab")
      .at(1)
      .trigger("click");

    await wrapper.vm.$nextTick();

    expect(actions.setSelectedIndex).toBeCalledWith(
      expect.anything(),
      expect.objectContaining({ index: 1 })
    );
  });

  test("Removes tab when x button clicked", async () => {
    const mockApi = mock<Api>();
    container.bind(Symbols.Api).toConstantValue(mockApi);

    const wrapper = mount(TabBar, {
      mocks: { $store: store },
      localVue,
      vuetify
    });

    await wrapper.vm.$nextTick();

    expect(wrapper.findAll(".v-tab")).toHaveLength(2);
    await wrapper
      .findAll(".v-tab")
      .at(1)
      .find(".v-btn")
      .trigger("click");

    await wrapper.vm.$nextTick();

    expect(actions.delete).toBeCalled();
    expect(actions.delete).toBeCalledWith(
      expect.anything(),
      expect.objectContaining({ tab: { id: 2, name: "Tab 2", session: expect.anything() } })
    );
  });
});
