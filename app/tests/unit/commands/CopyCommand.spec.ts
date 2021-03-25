import "reflect-metadata";
import CopyCommand from "@/commands/CopyCommand";
import { Store } from "vuex";
import jestMock from "jest-mock";
import AppState from "@/store/AppState";

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

describe("CopyCommand", () => {

  test("Never disabled", async () => {
    const store = new MockStore();

    const c = new CopyCommand(store);

    expect(c.isDisabled).toBeFalsy();
  });

  test("Action with no tabs does nothing", async () => {
    const store = new MockStore();
    new CopyCommand(store).action();

    expect(navigator.clipboard.writeText).not.toBeCalled();
  });

  test("Action with a tab copies text", async () => {
    const store = new MockStore();
    store.getters["tabs/selected"] = {
      session: {
        getTextRange: () => {
          return "Test";
        },
        getSelection: () => {
          return {
            getRange: () => {
              return null;
            }
          };
        }
      }
    };

    new CopyCommand(store).action();

    expect(navigator.clipboard.writeText).toBeCalledWith("Test");
  });
});
