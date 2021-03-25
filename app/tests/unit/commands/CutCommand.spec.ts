import "reflect-metadata";
import CutCommand from "@/commands/CutCommand";
import { Store } from "vuex";
import jestMock from "jest-mock";
import AppState from "@/store/AppState";

Object.assign(navigator, {
  clipboard: {
    writeText: jest.fn()
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

describe("CutCommand", () => {
  test("Never disabled", async () => {
    const store = new MockStore();
    const c = new CutCommand(store);

    expect(c.isDisabled).toBeFalsy();
  });

  test("Action with no tabs does nothing", async () => {
    const store = new MockStore();
    new CutCommand(store).action();

    expect(navigator.clipboard.writeText).not.toBeCalled();
  });

  test("Action with a tab copies text", async () => {
    const mockFn = jest.fn();

    const store = new MockStore();
    store.getters["tabs/selected"] = {
      session: {
        getTextRange: () => {
          return "Test";
        },
        getSelection: () => {
          return {
            getRange: () => {
              return "Range";
            }
          };
        },
        remove: mockFn
      }
    };

    new CutCommand(store).action();

    expect(navigator.clipboard.writeText).toBeCalledWith("Test");
    expect(mockFn).toBeCalledWith("Range");
  });
});
