import "reflect-metadata";
import OpenCommand from "@/commands/OpenCommand";
import { JSDOM } from "jsdom";
import { mock } from "jest-mock-extended";
import Api from "@/api/Api";
import Tab from "@/model/Tab";
import { Store } from "vuex";
import jestMock from "jest-mock";
import AppState from "@/store/AppState";
import FileInfo from "@/api/FileInfo";

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

const MockStore = (jestMock.fn(() => {
  return {
    getters: {
      "tabs/selected": null
    },
    dispatch: jestMock.fn()
  };
}) as unknown) as jestMock.Mock<Store<AppState>>;

describe("OpenCommand", () => {

  test("Never disabled", async () => {
    const api = mock<Api>();
    const store = new MockStore();
    const tabFactory = () => { return mock<Tab>() };

    const c = new OpenCommand(store, api, tabFactory);

    expect(c.isDisabled).toBeFalsy();
  });

  test("Action adds a tab", async () => {
    const api = mock<Api>();
    api.open.mockReturnValue(
      new Promise<FileInfo>(r => r(
        {
          name: "Test File",
          content: "Content"
        }))
    );    

    const store = new MockStore();
    const tabFactory = () => {
      return {
        fileName: null,
        name: "",
      } as Tab;
    };

    await new OpenCommand(store, api, tabFactory).action();

    expect(api.open).toBeCalled();

    expect(store.dispatch).toBeCalledWith(
      "tabs/add",
      expect.objectContaining({
        tab: expect.objectContaining({
          fileName: "Test File",
          name: "Test File",
          sqlText: "Content"
        })
      })
    );
  });

  test("IPC Action adds a tab", async () => {
    const api = mock<Api>();
    const store = new MockStore();

    const tabFactory = () => {
      return {
        fileName: null,
        name: "",
      } as Tab;
    };

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
          name: "Test File",
          sqlText: "Test Contents"
        })
      })
    );
  });
});
