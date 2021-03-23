import "reflect-metadata";
import NewCommand from "@/commands/NewCommand";
import { mock } from "jest-mock-extended";
import Api from "@/api/Api";
import Tab from "@/model/Tab";
import storeFactory from "@/store/electronStore";
import connectionsStateFactory from "@/store/modules/Connections";
import schemaStateFactory from "@/store/modules/Schema";
import tabsStateFactory from "@/store/modules/Tabs";

const store = storeFactory(connectionsStateFactory(), schemaStateFactory(), tabsStateFactory());

jest.mock("@/store", () => {
  return {
    dispatch: jest.fn(),
    getters: {
      "tabs/selected": null
    }
  };
});

describe("NewCommand", () => {
  beforeEach(() => {
    store.getters["tabs/selected"] = null;
  });

  test("Never disabled", async () => {
    const api = mock<Api>();
    const tabFactory = () => { return mock<Tab>() };

    const c = new NewCommand(store, api, tabFactory);

    expect(c.isDisabled).toBeFalsy();
  });

  test("Action adds a tab", async () => {
    const api = mock<Api>();
    const tabFactory = () => { return mock<Tab>() };

    new NewCommand(store, api, tabFactory).action();

    expect(store.dispatch).toBeCalledWith("tabs/add", expect.anything());
  });
});
