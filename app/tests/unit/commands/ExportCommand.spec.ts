import "reflect-metadata";
import ExportCommand from "@/commands/ExportCommand";
import { JSDOM } from "jsdom";
import { mock } from "jest-mock-extended";
import Api from "@/api/Api";
import jestMock from "jest-mock";
import AppState from "@/store/AppState";
import { Store } from "vuex";

jest.mock("uuid", () => ({
  v1: () => "testId"
}));

Object.assign(window, {
  ipcRenderer: {
    on: jest.fn(),
    removeListener: jest.fn()
  }
});

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

describe("ExportCommand", () => {
  beforeEach(() => {
    (document.body.appendChild as jest.Mock).mockReset();
    (document.body.removeChild as jest.Mock).mockReset();
    (window.ipcRenderer.on as jest.Mock).mockReset();
    (window.ipcRenderer.removeListener as jest.Mock).mockReset();
  });

  test("Disabled when no selected tab", async () => {
    const mockApi = mock<Api>();
    const store = new MockStore();
    const c = new ExportCommand(mockApi, store);

    expect(c.isDisabled).toBeTruthy();
  });

  test("Disabled when a tab has no result", async () => {
    const tab = {
      executionTime: "",
      grids: [
        {
          columnDefs: null
        }
      ]
    };
    const store = new MockStore();
    store.getters["tabs/selected"] = tab;

    const mockApi = mock<Api>();
    const c = new ExportCommand(mockApi, store);

    expect(c.isDisabled).toBeTruthy();
  });

  test("Disabled when a tab has no columns", async () => {
    const tab = {
      executionTime: "00:00:01",
      grids: [
        {
          columnDefs: null
        }
      ]
    };
    const store = new MockStore();
    store.getters["tabs/selected"] = tab;

    const mockApi = mock<Api>();
    const c = new ExportCommand(mockApi, store);

    expect(c.isDisabled).toBeTruthy();
  });

  test("Enabled when a tab is selected and there is a result", async () => {
    const tab = {
      executionTime: "00:00:01",
      grids: [
        {
          columnDefs: []
        }
      ]
    };
    const store = new MockStore();
    store.getters["tabs/selected"] = tab;

    const mockApi = mock<Api>();
    const c = new ExportCommand(mockApi, store);

    expect(c.isDisabled).toBeFalsy();
  });

  test("Action with a tab generates download", async () => {
    const tab = {
      name: "Test",
      executionTime: "00:00:01",
      grids: [
        {
          columnDefs: [{ headerName: "Column 1" }, { headerName: "Column 2" }],
          rowData: [["R1C1", "R1C2"]]
        }
      ]
    };
    const store = new MockStore();
    store.getters["tabs/selected"] = tab;

    const mockApi = mock<Api>();
    
    const c = new ExportCommand(mockApi, store);

    await c.action();

    expect(mockApi.save).toBeCalledWith("Test.csv", "Column 1,Column 2\nR1C1,R1C2\n", "csv");
  });

  test("Results with nulls", async () => {
    const tab = {
      name: "Test",
      executionTime: "00:00:01",
      grids: [
        {
          columnDefs: [ { headerName: "Column 1" }, { headerName: "Column 2" }],
          rowData: [["R1C1", null]]
        }
      ]
    };
    const store = new MockStore();
    store.getters["tabs/selected"] = tab;

    const mockApi = mock<Api>();
    await new ExportCommand(mockApi, store).action();

    expect(mockApi.save).toBeCalledWith("Test.csv", "Column 1,Column 2\nR1C1,\n", "csv");
  });

  test("Multiple results", async () => {
    const tab = {
      name: "Test",
      executionTime: "00:00:01",
      grids: [
        {
          columnDefs: [{ headerName: "Column 1" }, { headerName: "Column 2" }],
          rowData: [["1R1C1", "1R1C2"]]
        },
        {
          columnDefs: [{ headerName: "Column 1" }, { headerName: "Column 2" }],
          rowData: [["2R1C1", "2R1C2"]]
        }
      ]
    };
    const store = new MockStore();
    store.getters["tabs/selected"] = tab;

    const mockApi = mock<Api>();
    const c = new ExportCommand(mockApi, store);

    await c.action();

    expect(mockApi.save).toBeCalledWith("Test-1.csv", "Column 1,Column 2\n1R1C1,1R1C2\n", "csv");
    expect(mockApi.save).toBeCalledWith("Test-2.csv", "Column 1,Column 2\n2R1C1,2R1C2\n", "csv");
  });

  test("Save via IPC - no tab does nothing", async () => {
    const mockApi = mock<Api>();
    const store = new MockStore();
    const c = new ExportCommand(mockApi, store);

    c.ipcRendererAction(["test.csv"]);

    expect(mockApi.save).not.toBeCalled();
  });

  test("Save via IPC", async () => {
    const tab = {
      name: "Test",
      executionTime: "00:00:01",
      grids: [
        {
          columnDefs: [{ headerName: "Column 1" }, { headerName: "Column 2" }],
          rowData: [["R1C1", "R1C2"]]
        }
      ]
    };
    const store = new MockStore();
    store.getters["tabs/selected"] = tab;

    const mockApi = mock<Api>();
    const c = new ExportCommand(mockApi, store);

    await c.ipcRendererAction(["test.csv"]);

    expect(mockApi.save).toBeCalledWith("test.csv", "Column 1,Column 2\nR1C1,R1C2\n", "csv");
  });

  test("Save multiple recordsets IPC", async () => {
    const tab = {
      name: "Test",
      executionTime: "00:00:01",
      grids: [
        {
          columnDefs: [{ headerName: "Column 1" }, { headerName: "Column 2" }],
          rowData: [["1R1C1", "1R1C2"]]
        },
        {
          columnDefs: [{ headerName: "Column 1" }, { headerName: "Column 2" }],
          rowData: [["2R1C1", "2R1C2"]]
        }
      ]
    };
    const store = new MockStore();
    store.getters["tabs/selected"] = tab;

    const mockApi = mock<Api>();
    const c = new ExportCommand(mockApi, store);

    c.ipcRendererAction(["test.csv"]);

    expect(mockApi.save).toBeCalledWith("./test-1.csv", "Column 1,Column 2\n1R1C1,1R1C2\n", "csv");
    expect(mockApi.save).toBeCalledWith("./test-2.csv", "Column 1,Column 2\n2R1C1,2R1C2\n", "csv");
  });
});
