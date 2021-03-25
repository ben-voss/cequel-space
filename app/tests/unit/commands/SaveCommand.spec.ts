import "reflect-metadata";
import SaveCommand from "@/commands/SaveCommand";
import { JSDOM } from "jsdom";
import { mock } from "jest-mock-extended";
import { Store } from "vuex";
import Api from "@/api/Api";
import jestMock from "jest-mock";
import AppState from "@/store/AppState";

const dom = new JSDOM();
global.document = dom.window.document;
(global.window as unknown) = dom.window;

Object.assign(document.body, {
  appendChild: jest.fn(),
  removeChild: jest.fn()
});

const MockStore = (jestMock.fn(() => {
  return {
    getters: {
      "tabs/selected": null
    },
    dispatch: jestMock.fn()
  };
}) as unknown) as jestMock.Mock<Store<AppState>>;

describe("SaveCommand", () => {
  beforeEach(() => {
    (document.body.appendChild as jest.Mock).mockReset();
    (document.body.removeChild as jest.Mock).mockReset();
  });

  test("Disabled when no selected tab", async () => {
    const mockApi = mock<Api>();
    const store = new MockStore();
    const c = new SaveCommand(mockApi, store);

    expect(c.isDisabled).toBeTruthy();
  });

  test("Disabled when a tab has no edits", async () => {
    const store = new MockStore();
    const tab = {
      session: {
        getUndoManager: () => {
          return {
            isClean: () => {
              return true;
            }
          };
        }
      }
    };

    store.getters["tabs/selected"] = tab;

    const mockApi = mock<Api>();
    const c = new SaveCommand(mockApi, store);

    expect(c.isDisabled).toBeTruthy();
  });

  test("Enabled when a tab has edits", async () => {
    const store = new MockStore();
    const tab = {
      session: {
        getUndoManager: () => {
          return {
            isClean: () => {
              return false;
            }
          };
        }
      }
    };
    store.getters["tabs/selected"] = tab;

    const mockApi = mock<Api>();
    const c = new SaveCommand(mockApi, store);

    expect(c.isDisabled).toBeFalsy();
  });

  test("Action with a tab generates download", async () => {
    const store = new MockStore();
    Object.assign(window, {
      ipcRenderer: undefined
    });

    const tab = {
      name: "Test",
      sqlText: "Test",
      session: {
        getUndoManager: () => {
          return {
            isClean: () => {
              return false;
            }
          };
        }
      }
    };
    store.getters["tabs/selected"] = tab;

    const mockApi = mock<Api>();
    const c = new SaveCommand(mockApi, store);

    await c.action();

    expect(mockApi.saveAs).toBeCalledWith("Test", "sql");
  });

  test("Save via IPC", async () => {
    const store = new MockStore();
    try {
      let bb = () => {
        //
      };

      Object.assign(window, {
        ipcRenderer: {
          on: jest.fn((a, b) => {
            bb = b;
          })
        }
      });

      const tab = {
        sqlText: "Test",
        session: {
          getUndoManager: () => {
            return {
              isClean: () => {
                return true;
              }
            };
          }
        }
      };
      store.getters["tabs/selected"] = tab;

      const mockApi = mock<Api>();
      const c = new SaveCommand(mockApi, store);

      bb();

      //c.ipcRendererAction([]);

      expect(mockApi.saveAs).toBeCalledWith("Test", "sql");
    } finally {
      Object.assign(window, {
        ipcRenderer: undefined
      });
    }
  });
});
