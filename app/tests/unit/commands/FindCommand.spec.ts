import "reflect-metadata";
import FindCommand from "@/commands/FindCommand";
import brace from "brace";
import { mock } from "jest-mock-extended";
import AppState from "@/store/AppState";
import { Store } from "vuex";
import jestMock from "jest-mock";

const MockStore = (jestMock.fn(() => {
  return {
    getters: {
      "tabs/selected": null
    }
  };
}) as unknown) as jestMock.Mock<Store<AppState>>;

describe("FindCommand", () => {

  test("Disabled when no selected tab", async () => {
    const c = new FindCommand(new MockStore(), {} as brace.Editor);

    expect(c.isDisabled).toBeTruthy();
  });

  test("Enabled when a tab is selected", async () => {
    const store = new MockStore();
    store.getters["tabs/selected"] = {};

    const c = new FindCommand(store, {} as brace.Editor);

    expect(c.isDisabled).toBeFalsy();
  });

  test("Action sends find command", async () => {
    const mockEditor = mock<brace.Editor>();

    new FindCommand(new MockStore(), mockEditor).action();

    expect(mockEditor.execCommand).toBeCalledWith("find");
  });
});
