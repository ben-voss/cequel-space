import "reflect-metadata";
import ExportCommand from "@/commands/ExportCommand";
import { JSDOM } from "jsdom";
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

jest.mock("@/store", () => {
  return {
    getters: {
      "tabs/selected": null
    }
  };
});

describe("ExportCommand", () => {
  beforeEach(() => {
    store.getters["tabs/selected"] = null;
    (document.body.appendChild as jest.Mock).mockReset();
    (document.body.removeChild as jest.Mock).mockReset();
    (window.ipcRenderer.on as jest.Mock).mockReset();
    (window.ipcRenderer.removeListener as jest.Mock).mockReset();
  });

  test("Disabled when no selected tab", async () => {
    const mockApi = mock<Api>();
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
    store.getters["tabs/selected"] = tab;

    const mockApi = mock<Api>();
    const c = new ExportCommand(mockApi, store);

    await c.action();

    const expectedObj = document.createElement("A");
    expectedObj.setAttribute("download", "Test.csv");
    expectedObj.setAttribute(
      "href",
      "data:application/csv,Column%201%2CColumn%202%0D%0AR1C1%2CR1C2%0D%0A"
    );

    expect(document.body.appendChild).toBeCalledWith(expectedObj);
    expect(document.body.removeChild).toBeCalledWith(expectedObj);
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
    store.getters["tabs/selected"] = tab;

    const mockApi = mock<Api>();
    await new ExportCommand(mockApi, store).action();

    const expectedObj = document.createElement("A");
    expectedObj.setAttribute("download", "Test.csv");
    expectedObj.setAttribute(
      "href",
      "data:application/csv,Column%201%2CColumn%202%0D%0AR1C1%2C%0D%0A"
    );

    expect(document.body.appendChild).toBeCalledWith(expectedObj);
    expect(document.body.removeChild).toBeCalledWith(expectedObj);
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
    store.getters["tabs/selected"] = tab;

    const mockApi = mock<Api>();
    const c = new ExportCommand(mockApi, store);

    await c.action();

    let expectedObj = document.createElement("A");
    expectedObj.setAttribute("download", "Test-1.csv");
    expectedObj.setAttribute(
      "href",
      "data:application/csv,Column%201%2CColumn%202%0D%0A1R1C1%2C1R1C2%0D%0A"
    );

    expect(document.body.appendChild).toBeCalledWith(expectedObj);
    expect(document.body.removeChild).toBeCalledWith(expectedObj);

    expectedObj = document.createElement("A");
    expectedObj.setAttribute("download", "Test-2.csv");
    expectedObj.setAttribute(
      "href",
      "data:application/csv,Column%201%2CColumn%202%0D%0A2R1C1%2C2R1C2%0D%0A"
    );

    expect(document.body.appendChild).toBeCalledWith(expectedObj);
    expect(document.body.removeChild).toBeCalledWith(expectedObj);
  });

  test("Save via IPC - no tab does nothing", async () => {
    const mockApi = mock<Api>();
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
    store.getters["tabs/selected"] = tab;

    const mockApi = mock<Api>();
    const c = new ExportCommand(mockApi, store);

    await c.ipcRendererAction(["test.csv"]);

    expect(mockApi.save).toBeCalledWith(
      "test.csv",
      "Column 1,Column 2\r\nR1C1,R1C2\r\n",
      "csv"
    );
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
    store.getters["tabs/selected"] = tab;

    const mockApi = mock<Api>();
    const c = new ExportCommand(mockApi, store);

    c.ipcRendererAction(["test.csv"]);

    expect(mockApi.save).toBeCalledWith(
      "./test-1.csv",
      "Column 1,Column 2\r\n1R1C1,1R1C2\r\n",
      "csv"
    );

    expect(mockApi.save).toBeCalledWith(
      "./test-2.csv",
      "Column 1,Column 2\r\n2R1C1,2R1C2\r\n",
      "csv"
    );
  });
});
