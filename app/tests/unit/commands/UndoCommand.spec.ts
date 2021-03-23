import "reflect-metadata";
import UndoCommand from "@/commands/UndoCommand";
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

describe("UndoCommand", () => {
  beforeEach(() => {
    store.getters["tabs/selected"] = null;
  });

  test("Disabled when no selected tab", async () => {
    const c = new UndoCommand(store);

    expect(c.isDisabled).toBeTruthy();
  });

  test("Disabled when a tab is selected and cannot undo", async () => {
    const tab = {
      session: {
        getUndoManager: () => {
          return {
            hasUndo: () => {
              return false;
            }
          };
        }
      }
    };

    store.getters["tabs/selected"] = tab;

    const c = new UndoCommand(store);

    expect(c.isDisabled).toBeTruthy();
  });

  test("Enabled when a tab is selected and can undo", async () => {
    const tab = {
      session: {
        getUndoManager: () => {
          return {
            hasUndo: () => {
              return true;
            }
          };
        }
      }
    };

    store.getters["tabs/selected"] = tab;

    const c = new UndoCommand(store);

    expect(c.isDisabled).toBeFalsy();
  });

  test("Action with no tabs does nothing", async () => {
    await new UndoCommand(store).action();
  });

  test("Action with a tab calls redo", async () => {
    const mockFn = jest.fn();

    store.getters["tabs/selected"] = {
      session: {
        getUndoManager: () => {
          return {
            undo: mockFn,
            hasUndo: () => {
              return true;
            }
          };
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

    await new UndoCommand(store).action();

    expect(mockFn).toBeCalled();
  });
});
