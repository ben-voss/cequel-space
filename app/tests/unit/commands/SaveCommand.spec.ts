import "reflect-metadata";
import SaveCommand from "@/commands/SaveCommand";
import { JSDOM } from "jsdom";
import { mock } from "jest-mock-extended";
import storeFactory from "@/store/electronStore";
import connectionsStateFactory from "@/store/modules/Connections";
import schemaStateFactory from "@/store/modules/Schema";
import tabsStateFactory from "@/store/modules/Tabs";
import Api from "@/api/Api";

const store = storeFactory(
  connectionsStateFactory(),
  schemaStateFactory(),
  tabsStateFactory()
);

const dom = new JSDOM();
global.document = dom.window.document;
(global.window as unknown) = dom.window;

Object.assign(document.body, {
  appendChild: jest.fn(),
  removeChild: jest.fn()
});

jest.mock("@/store", () => {
  return {
    getters: {
      "tabs/selected": null
    }
  };
});

describe("SaveCommand", () => {
  beforeEach(() => {
    store.getters["tabs/selected"] = null;
    (document.body.appendChild as jest.Mock).mockReset();
    (document.body.removeChild as jest.Mock).mockReset();
  });

  test("Disabled when no selected tab", async () => {
    const mockApi = mock<Api>();
    const c = new SaveCommand(mockApi, store);

    expect(c.isDisabled).toBeTruthy();
  });

  test("Disabled when a tab has no edits", async () => {
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

    const expectedObj = document.createElement("A");
    expectedObj.setAttribute("download", "Test.sql");
    expectedObj.setAttribute("href", "data:application/sql,Test");

    expect(document.body.appendChild).toBeCalledWith(expectedObj);
    expect(document.body.removeChild).toBeCalledWith(expectedObj);
  });

  test("Save via IPC", async () => {
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

      expect(mockApi.saveAs).toBeCalledWith("Test", "csv");
    } finally {
      Object.assign(window, {
        ipcRenderer: undefined
      });
    }
  });
});
