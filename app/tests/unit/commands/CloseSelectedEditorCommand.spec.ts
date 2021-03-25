import "reflect-metadata";
import CloseSelectedEditorCommand from "@/commands/CloseSelectedEditorCommand";
import { mock } from "jest-mock-extended";
import Api from "@/api/Api";
import jestMock from "jest-mock";
import AppState from "@/store/AppState";
import { Store } from "vuex";

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

const MockStore = (jestMock.fn(() => {
  return {
    getters: {
      "tabs/selected": null
    },
    dispatch: jestMock.fn()
  };
}) as unknown) as jestMock.Mock<Store<AppState>>;

describe("CloseSelectedEditorCommand", () => {
  beforeEach(() => {
    (window.ipcRenderer.on as jest.Mock).mockReset();
  });

  test("Disabled when there is no selected tab", async () => {
    const mockApi = mock<Api>();
    const mockStore = new MockStore();

    const c = new CloseSelectedEditorCommand(mockApi, mockStore);

    expect(c.isDisabled).toBeTruthy();
  });

  test("Enabled when there is a selected tab", async () => {
    const mockApi = mock<Api>();
    const mockStore = new MockStore();

    const c = new CloseSelectedEditorCommand(mockApi, mockStore);
    mockStore.getters["tabs/selected"] = {};

    expect(c.isDisabled).toBeFalsy();
  });

  test("Action with no tabs does nothing", async () => {
    const mockApi = mock<Api>();
    const mockStore = new MockStore();

    new CloseSelectedEditorCommand(mockApi, mockStore).action();
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
    const mockStore = new MockStore();
    mockStore.getters["tabs/selected"] = tab;

    const mockApi = mock<Api>();
    new CloseSelectedEditorCommand(mockApi, mockStore).action();

    expect(mockStore.dispatch).toBeCalledWith("tabs/delete", { tab });
  });

  test("Action with a dirty tab asks for confirmation.", async () => {
    const mockStore = new MockStore();
    mockStore.getters["tabs/selected"] = {
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
    await new CloseSelectedEditorCommand(mockApi, mockStore).action();

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
    const mockStore = new MockStore();

    mockStore.getters["tabs/selected"] = tab;

    const mockApi = mock<Api>();
    mockApi.messageBox.mockReturnValue(
      new Promise<number>(r => r(0))
    );

    await new CloseSelectedEditorCommand(mockApi, mockStore).action();

    expect(mockApi.save).toBeCalledWith("Test File Name", "Test SQL", "sql");
    expect(mockStore.dispatch).toBeCalledWith("tabs/delete", { tab });
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
    const mockStore = new MockStore();
    mockStore.getters["tabs/selected"] = tab;

    const c = new CloseSelectedEditorCommand(mockApi, mockStore);

    await c.action();

    expect(mockApi.save).not.toBeCalledWith(expect.anything());
    expect(mockStore.dispatch).toBeCalledWith("tabs/delete", { tab });
  });

  test("Confirmation with with cancelling does nothing.", async () => {
    const mockApi = mock<Api>();
    mockApi.messageBox.mockReturnValue(
      new Promise<number>(r => r(2))
    );
    const mockStore = new MockStore();
    mockStore.getters["tabs/selected"] = {
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

    new CloseSelectedEditorCommand(mockApi, mockStore).action();

    expect(mockApi.save).not.toBeCalledWith(expect.anything());
    expect(mockStore.dispatch).not.toBeCalled();
  });
});
