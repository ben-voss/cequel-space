import "reflect-metadata";
import SettingsCommand from "@/commands/SettingsCommand";

describe("ConnectionsCommand", () => {
  test("Always enabled", async () => {
    const c = new SettingsCommand(jest.fn());

    expect(c.isDisabled).toBeFalsy();
  });

  test("Invokes action when run", async () => {
    const mockFunction = jest.fn();

    new SettingsCommand(mockFunction).action();

    expect(mockFunction).toBeCalled();
  });
});
