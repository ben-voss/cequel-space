import "reflect-metadata";
import ConnectionsCommand from "@/commands/ConnectionsCommand";

describe("ConnectionsCommand", () => {
  test("Always enabled", async () => {
    const c = new ConnectionsCommand(jest.fn());

    expect(c.isDisabled).toBeFalsy();
  });

  test("Invokes action when run", async () => {
    const mockFunction = jest.fn();

    new ConnectionsCommand(mockFunction).action();

    expect(mockFunction).toBeCalled();
  });
});
