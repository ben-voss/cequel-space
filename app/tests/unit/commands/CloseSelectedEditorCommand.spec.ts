import "reflect-metadata";
import CloseSelectedEditorCommand from "@/commands/CloseSelectedEditorCommand";
import RpcClient from "@/rpc/RpcClient";
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

Object.assign(window, {
  ipcRenderer: {
    on: jest.fn()
  }
});

Object.assign(navigator, {
  clipboard: {
    writeText: jest.fn(),
    readText: jest.fn()
  }
});

jest.mock("vuex/store", () => {
  return {
    dispatch: jest.fn(),
    getters: {
      "tabs/selected": null
    }
  };
});

describe("CloseSelectedEditorCommand", () => {
  beforeEach(() => {
    store.getters["tabs/selected"] = null;
    (window.ipcRenderer.on as jest.Mock).mockReset();
    (store.dispatch as jest.Mock).mockReset();
  });

  test("Disabled when there is no selected tab", async () => {
    const mockApi = mock<Api>();

    const c = new CloseSelectedEditorCommand(mockApi, store);

    expect(c.isDisabled).toBeTruthy();
  });

  test("Enabled when there is a selected tab", async () => {
    const mockApi = mock<Api>();

    const c = new CloseSelectedEditorCommand(mockApi, store);
    store.getters["tabs/selected"] = {};

    expect(c.isDisabled).toBeFalsy();
  });

  test("Action with no tabs does nothing", async () => {
    const mockApi = mock<Api>();

    new CloseSelectedEditorCommand(mockApi, store).action();
  });

  test("Action with a tab closes the tab", async () => {
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
    new CloseSelectedEditorCommand(mockApi, store).action();

    expect(store.dispatch).toBeCalledWith("tabs/delete", { tab });
  });

  test("Action with a dirty tab asks for confirmation.", async () => {
    store.getters["tabs/selected"] = {
      session: {
        getUndoManager: () => {
          return {
            isClean: () => {
              return false;
            }
          };
        }
      },
      name: "Test"
    };

    const mockApi = mock<Api>();
    await new CloseSelectedEditorCommand(mockApi, store).action();

    expect(mockApi.messageBox).toBeCalledWith({
      buttons: ["Save", "Don't Save", "Cancel"],
      cancelId: 2,
      detail: "Your changes will be lost if you don't save them.",
      message: "Do you want to save the changes you made to Test?",
      type: "question"
    });
  });

  test("Confirmation with saving closes with saving.", async () => {
    const tab = {
      session: {
        getUndoManager: () => {
          return {
            isClean: () => {
              return false;
            }
          };
        }
      },
      fileName: "Test File Name",
      sqlText: "Test SQL"
    };

    store.getters["tabs/selected"] = tab;

    const mockApi = mock<Api>();
    mockApi.messageBox.mockReturnValue(
      new Promise<number>(r => r(0))
    );

    await new CloseSelectedEditorCommand(mockApi, store).action();

    expect(mockApi.save).toBeCalledWith("Test File Name", "Test SQL");
    expect(store.dispatch).toBeCalledWith("tabs/delete", { tab });
  });

  test("Confirmation with not saving closes without saving.", async () => {
    const mockApi = mock<Api>();
    mockApi.messageBox.mockReturnValue(
      new Promise<number>(r => r(1))
    );

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

    const c = new CloseSelectedEditorCommand(mockApi, store);

    await c.action();

    expect(mockApi.save).not.toBeCalledWith(expect.anything());
    expect(store.dispatch).toBeCalledWith("tabs/delete", { tab });
  });

  test("Confirmation with with cancelling does nothing.", async () => {
    const mockApi = mock<Api>();
    mockApi.messageBox.mockReturnValue(
      new Promise<number>(r => r(2))
    );

    store.getters["tabs/selected"] = {
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

    new CloseSelectedEditorCommand(mockApi, store).action();

    expect(mockApi.save).not.toBeCalledWith(expect.anything());
    expect(store.dispatch).not.toBeCalled();
  });
});
