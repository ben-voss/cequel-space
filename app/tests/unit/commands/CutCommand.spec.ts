import "reflect-metadata";
import CutCommand from "@/commands/CutCommand";
import storeFactory from "@/store/electronStore";
import connectionsStateFactory from "@/store/modules/Connections";
import schemaStateFactory from "@/store/modules/Schema";
import tabsStateFactory from "@/store/modules/Tabs";

const store = storeFactory(connectionsStateFactory(), schemaStateFactory(), tabsStateFactory());

Object.assign(navigator, {
  clipboard: {
    writeText: jest.fn()
  }
});

jest.mock("@/store", () => {
  return {
    getters: {
      "tabs/selected": null
    }
  };
});

describe("CutCommand", () => {
  beforeEach(() => {
    store.getters["tabs/selected"] = null;
  });

  test("Never disabled", async () => {
    const c = new CutCommand(store);

    expect(c.isDisabled).toBeFalsy();
  });

  test("Action with no tabs does nothing", async () => {
    new CutCommand(store).action();

    expect(navigator.clipboard.writeText).not.toBeCalled();
  });

  test("Action with a tab copies text", async () => {
    const mockFn = jest.fn();

    store.getters["tabs/selected"] = {
      session: {
        getTextRange: () => {
          return "Test";
        },
        getSelection: () => {
          return {
            getRange: () => {
              return "Range";
            }
          };
        },
        remove: mockFn
      }
    };

    new CutCommand(store).action();

    expect(navigator.clipboard.writeText).toBeCalledWith("Test");
    expect(mockFn).toBeCalledWith("Range");
  });
});
