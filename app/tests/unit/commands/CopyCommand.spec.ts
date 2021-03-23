import "reflect-metadata";
import CopyCommand from "@/commands/CopyCommand";
import { Store } from "vuex";
import { mock } from "jest-mock-extended";
import AppState from "@/store/AppState";
import storeFactory from "@/store/electronStore";
import connectionsStateFactory from "@/store/modules/Connections";
import schemaStateFactory from "@/store/modules/Schema";
import tabsStateFactory from "@/store/modules/Tabs";

const store = storeFactory(connectionsStateFactory(), schemaStateFactory(), tabsStateFactory());

Object.assign(navigator, {
  clipboard: {
    writeText: jest.fn(),
    readText: jest.fn()
  }
});

jest.mock("@/store", () => {
  return {
    getters: {
      "tabs/selected": null
    }
  };
});

describe("CopyCommand", () => {
  beforeEach(() => {
    store.getters["tabs/selected"] = null;
  });

  test("Never disabled", async () => {
    const store = mock<Store<AppState>>();

    const c = new CopyCommand(store);

    expect(c.isDisabled).toBeFalsy();
  });

  test("Action with no tabs does nothing", async () => {
    const store = mock<Store<AppState>>();
    new CopyCommand(store).action();

    expect(navigator.clipboard.writeText).not.toBeCalled();
  });

  test("Action with a tab copies text", async () => {
    store.getters["tabs/selected"] = {
      session: {
        getTextRange: () => {
          return "Test";
        },
        getSelection: () => {
          return {
            getRange: () => {
              return null;
            }
          };
        }
      }
    };

    new CopyCommand(store).action();

    expect(navigator.clipboard.writeText).toBeCalledWith("Test");
  });
});
