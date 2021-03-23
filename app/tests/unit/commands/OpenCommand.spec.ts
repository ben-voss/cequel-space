import "reflect-metadata";
import OpenCommand from "@/commands/OpenCommand";
import { JSDOM } from "jsdom";
import RpcClient from "@/rpc/RpcClient";
import { mock } from "jest-mock-extended";
import Api from "@/api/Api";
import Tab from "@/model/Tab";
import storeFactory from "@/store/electronStore";
import connectionsStateFactory from "@/store/modules/Connections";
import schemaStateFactory from "@/store/modules/Schema";
import tabsStateFactory from "@/store/modules/Tabs";

const store = storeFactory(
  connectionsStateFactory(),
  schemaStateFactory(),
  tabsStateFactory()
);

const dom = new JSDOM();
global.document = dom.window.document;
(global.window as unknown) = dom.window;

let mockOnloadFunc: (a: unknown) => void;

jest.spyOn(FileReader.prototype, "onload", "set").mockImplementation(fn => {
  mockOnloadFunc = fn as (v: unknown) => void;
});

jest.spyOn(FileReader.prototype, "readAsText").mockImplementation(() => {
  mockOnloadFunc(({
    target: {
      result: "Test Content"
    }
  } as unknown) as Event);
});

Object.assign(document.body, {
  appendChild: jest.fn((fileInput: HTMLInputElement) => {
    if (!fileInput) {
      return;
    }

    fileInput.onclick = () => {
      if (!fileInput.onchange) {
        return;
      }

      fileInput.onchange(({
        target: {
          files: [{ name: "Test File.sql" }]
        }
      } as unknown) as Event);
    };
  }),
  removeChild: jest.fn()
});

jest.mock("@/store", () => {
  return {
    dispatch: jest.fn()
  };
});

describe("OpenCommand", () => {
  beforeEach(() => {
    (document.body.appendChild as jest.Mock).mockClear();
    (document.body.removeChild as jest.Mock).mockClear();
  });

  test("Never disabled", async () => {
    const api = mock<Api>();
    const tabFactory = () => { return mock<Tab>() };

    const c = new OpenCommand(store, api, tabFactory);

    expect(c.isDisabled).toBeFalsy();
  });

  test("Action adds a tab", async () => {
    Object.assign(window, {
      ipcRenderer: null
    });

    const api = mock<Api>();
    const tabFactory = () => { return mock<Tab>() };

    await new OpenCommand(store, api, tabFactory).action();

    const expectedObj = document.createElement("input");
    expectedObj.type = "file";
    expectedObj.accept = ".sql,*.txt";
    expectedObj.style.display = "none";

    expect(document.body.appendChild).toBeCalledWith(expectedObj);
    expect(document.body.removeChild).toBeCalledWith(expectedObj);

    expect(store.dispatch).toBeCalledWith(
      "tabs/add",
      expect.objectContaining({
        tab: expect.objectContaining({
          fileName: "Test File.sql",
          name: "Test File"
        })
      })
    );
  });

  test("IPC Action adds a tab", async () => {
    Object.assign(window, {
      ipcRenderer: {
        send: jest.fn(),
        on: jest.fn()
      }
    });

    const api = mock<Api>();
    const tabFactory = () => { return mock<Tab>() };

    new OpenCommand(store, api, tabFactory).ipcRendererAction([
      "",
      "Test File.sql",
      "Test Contents"
    ]);

    expect(store.dispatch).toBeCalledWith(
      "tabs/add",
      expect.objectContaining({
        tab: expect.objectContaining({
          fileName: "Test File.sql",
          name: "Test File"
        })
      })
    );
  });
});
