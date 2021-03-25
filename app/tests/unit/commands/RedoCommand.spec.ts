import "reflect-metadata";
import RedoCommand from "@/commands/RedoCommand";
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

describe("RedoCommand", () => {
  test("Disabled when no selected tab", async () => {
    const store = new MockStore();
    const c = new RedoCommand(store);

    expect(c.isDisabled).toBeTruthy();
  });

  test("Disabled when a tab is selected and cannot redo", async () => {
    const store = new MockStore();
    const tab = {
      session: {
        getUndoManager: () => {
          return {
            hasRedo: () => {
              return false;
            }
          };
        }
      }
    };

    store.getters["tabs/selected"] = tab;

    const c = new RedoCommand(store);

    expect(c.isDisabled).toBeTruthy();
  });

  test("Enabled when a tab is selected and can redo", async () => {
    const store = new MockStore();
    const tab = {
      session: {
        getUndoManager: () => {
          return {
            hasRedo: () => {
              return true;
            }
          };
        }
      }
    };

    store.getters["tabs/selected"] = tab;

    const c = new RedoCommand(store);

    expect(c.isDisabled).toBeFalsy();
  });

  test("Action with no tabs does nothing", async () => {
    const store = new MockStore();
    await new RedoCommand(store).action();
  });

  test("Action with a tab calls redo", async () => {
    const store = new MockStore();
    const mockFn = jest.fn();

    store.getters["tabs/selected"] = {
      session: {
        getUndoManager: () => {
          return {
            redo: mockFn,
            hasRedo: () => {
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
        },
      }
    };

    await new RedoCommand(store).action();

    expect(mockFn).toBeCalled();
  });
});
