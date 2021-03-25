import "reflect-metadata";
import NewCommand from "@/commands/NewCommand";
import { mock } from "jest-mock-extended";
import Api from "@/api/Api";
import Tab from "@/model/Tab";
import { Store } from "vuex";
import jestMock from "jest-mock";
import AppState from "@/store/AppState";

const MockStore = (jestMock.fn(() => {
  return {
    getters: {
      "tabs/selected": null
    },
    dispatch: jestMock.fn()
  };
}) as unknown) as jestMock.Mock<Store<AppState>>;

describe("NewCommand", () => {

  test("Never disabled", async () => {
    const api = mock<Api>();
    const store = new MockStore();
    const tabFactory = () => { return mock<Tab>() };

    const c = new NewCommand(store, api, tabFactory);

    expect(c.isDisabled).toBeFalsy();
  });

  test("Action adds a tab", async () => {
    const api = mock<Api>();
    const store = new MockStore();
    const tabFactory = () => { return mock<Tab>() };

    new NewCommand(store, api, tabFactory).action();

    expect(store.dispatch).toBeCalledWith("tabs/add", expect.anything());
  });
});
