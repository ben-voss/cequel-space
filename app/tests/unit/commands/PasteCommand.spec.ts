import "reflect-metadata";
import PasteCommand from "@/commands/PasteCommand";
import { Store } from "vuex";
import jestMock from "jest-mock";
import AppState from "@/store/AppState";

Object.assign(navigator, {
  clipboard: {
    readText: jest.fn().mockReturnValue("Test")
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

describe("PasteCommand", () => {

  test("Never disabled", async () => {
    const store = new MockStore();
    const c = new PasteCommand(store);

    expect(c.isDisabled).toBeFalsy();
  });

  test("Action with no tabs does nothing", async () => {
    const store = new MockStore();
    await new PasteCommand(store).action();

    expect(navigator.clipboard.readText).not.toBeCalled();
  });

  test("Action with a tab copies text", async () => {
    const store = new MockStore();
    const mockFn = jest.fn();

    store.getters["tabs/selected"] = {
      session: {
        getSelection: () => {
          return {
            getRange: () => {
              return null;
            }
          };
        },
        replace: mockFn
      }
    };

    await new PasteCommand(store).action();

    expect(mockFn).toBeCalledWith(null, "Test");
  });
});
