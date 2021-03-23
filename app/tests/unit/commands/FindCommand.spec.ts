import "reflect-metadata";
import FindCommand from "@/commands/FindCommand";
import brace from "brace";
import { mock } from "jest-mock-extended";
import storeFactory from "@/store/electronStore";
import connectionsStateFactory from "@/store/modules/Connections";
import schemaStateFactory from "@/store/modules/Schema";
import tabsStateFactory from "@/store/modules/Tabs";

const store = storeFactory(connectionsStateFactory(), schemaStateFactory(), tabsStateFactory());

jest.mock("@/store", () => {
  return {
    getters: {
      "tabs/selected": null
    }
  };
});

describe("FindCommand", () => {
  beforeEach(() => {
    store.getters["tabs/selected"] = null;
  });

  test("Disabled when no selected tab", async () => {
    const c = new FindCommand(store, {} as brace.Editor);

    expect(c.isDisabled).toBeTruthy();
  });

  test("Enabled when a tab is selected", async () => {
    store.getters["tabs/selected"] = {};

    const c = new FindCommand(store, {} as brace.Editor);

    expect(c.isDisabled).toBeFalsy();
  });

  test("Action sends find command", async () => {
    const mockEditor = mock<brace.Editor>();

    new FindCommand(store, mockEditor).action();

    expect(mockEditor.execCommand).toBeCalledWith("find");
  });
});
