import "reflect-metadata";
import UndoCommand from "@/commands/UndoCommand";
import storeFactory from "@/store/electronStore";
import { Store } from "vuex";
import Api from "@/api/Api";
import jestMock from "jest-mock";
import AppState from "@/store/AppState";

Object.assign(navigator, {
  clipboard: {
    readText: jest.fn().mockReturnValue("Test")
  }
});

const MockStore = (jestMock.fn(() => {
  return {
    getters: {
      "tabs/selected": null
    },
    dispatch: jestMock.fn()
  };
}) as unknown) as jestMock.Mock<Store<AppState>>;

describe("UndoCommand", () => {

  test("Disabled when no selected tab", async () => {
    const store = new MockStore();
    const c = new UndoCommand(store);

    expect(c.isDisabled).toBeTruthy();
  });

  test("Disabled when a tab is selected and cannot undo", async () => {
    const store = new MockStore();
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
    const store = new MockStore();
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
    const store = new MockStore();
    await new UndoCommand(store).action();
  });

  test("Action with a tab calls redo", async () => {
    const store = new MockStore();
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
