import "reflect-metadata";
import PasteCommand from "@/commands/PasteCommand";
import storeFactory from "@/store/electronStore";
import connectionsStateFactory from "@/store/modules/Connections";
import schemaStateFactory from "@/store/modules/Schema";
import tabsStateFactory from "@/store/modules/Tabs";

const store = storeFactory(connectionsStateFactory(), schemaStateFactory(), tabsStateFactory());

Object.assign(navigator, {
  clipboard: {
    readText: jest.fn().mockReturnValue("Test")
  }
});

jest.mock("@/store", () => {
  return {
    getters: {
      "tabs/selected": null
    }
  };
});

describe("PasteCommand", () => {
  beforeEach(() => {
    store.getters["tabs/selected"] = null;
  });

  test("Never disabled", async () => {
    const c = new PasteCommand(store);

    expect(c.isDisabled).toBeFalsy();
  });

  test("Action with no tabs does nothing", async () => {
    await new PasteCommand(store).action();

    expect(navigator.clipboard.readText).not.toBeCalled();
  });

  test("Action with a tab copies text", async () => {
    const mockFn = jest.fn();

    store.getters["tabs/selected"] = {
      session: {
        getSelection: () => {
          return {
            getRange: () => {
              return null;
            }
          };
        },
        replace: mockFn
      }
    };

    await new PasteCommand(store).action();

    expect(mockFn).toBeCalledWith(null, "Test");
  });
});
