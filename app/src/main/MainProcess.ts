"use strict";

import path from "path";
import fs from "fs";
import util from "util";
import {
  shell,
  dialog,
  app,
  protocol,
  BrowserWindow,
  Menu,
  MenuItem,
  ipcMain,
  screen
} from "electron";
import { createProtocol } from "vue-cli-plugin-electron-builder/lib";
import installExtension, { VUEJS_DEVTOOLS } from "electron-devtools-installer";
import WindowPromise from "./WindowPromise";
import RpcController from "./RpcController";

const readFileAsync = util.promisify(fs.readFile);

const isDevelopment = process.env.NODE_ENV !== "production";
const isMac = process.platform === "darwin";

declare let __static: string;

export default class MainProcess {
  private windows = new Set<BrowserWindow>();
  private windowPromises = new Map<number, WindowPromise>();
  private rpcController = new RpcController();
  private menuStates = new Map<number, Map<string, boolean>>();

  constructor() {
    // Scheme must be registered before the app is ready
    protocol.registerSchemesAsPrivileged([
      { scheme: "app", privileges: { secure: true, standard: true } }
    ]);

    app.on("window-all-closed", () => this.handleWindowAllClosed());
    app.on("activate", () => this.handleActivate());
    app.on("ready", () => this.handleReady());
    app.on("open-file", (e, p) => this.handleOpenFile(e, p));

    // Exit cleanly on request from parent process in development mode.
    if (isDevelopment) {
      if (process.platform === "win32") {
        process.on("message", data => {
          if (data === "graceful-exit") {
            app.quit();
          }
        });
      } else {
        process.on("SIGTERM", () => {
          app.quit();
        });
      }
    }

    // Setup a listener for the event that indicates the browser windows ipc listener
    // is hooked up and ready to receive.
    ipcMain.on("READY", event => {
      const id = event.sender.id;

      for (const window of this.windows) {
        if (window.webContents.id === id) {
          const windowPromise = this.windowPromises.get(id);
          if (windowPromise) {
            this.windowPromises.delete(id);
            windowPromise.resolve(window);
          }
        }
      }
    });

    ipcMain.on("MENU", (_event, menu: string, disabled: boolean) => {
      // Store the menu states by window
      let states = this.menuStates.get(_event.sender.id);
      if (!states) {
        states = new Map<string, boolean>();
        this.menuStates.set(_event.sender.id, states);
      }

      states.set(menu, disabled);

      // Update the menu if the state change came from the current window
      const currentWindow = BrowserWindow.getFocusedWindow();
      if (currentWindow && currentWindow.webContents.id == _event.sender.id) {
        const mainMenu = Menu.getApplicationMenu();
        if (mainMenu) {
          const menuItem = mainMenu.getMenuItemById(menu);
          if (menuItem) {
            menuItem.enabled = !disabled;
          }
        }
      }
    });
  }

  // Quit when all windows are closed.
  private handleWindowAllClosed(): boolean {
    // On macOS it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform === "darwin") {
      // Disable all the menus that need to be disabled
      const mainMenu = Menu.getApplicationMenu();
      if (mainMenu) {
        mainMenu.getMenuItemById("save").enabled = false;
        mainMenu.getMenuItemById("saveAs").enabled = false;
        mainMenu.getMenuItemById("closeEditor").enabled = false;
        mainMenu.getMenuItemById("find").enabled = false;
        mainMenu.getMenuItemById("run").enabled = false;
        mainMenu.getMenuItemById("stop").enabled = false;
        mainMenu.getMenuItemById("export").enabled = false;
      }

      return false;
    }

    app.quit();
    return true;
  }

  private async handleActivate(): Promise<void> {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (this.windows.size === 0) {
      const browserWindow = await this.createWindow();
      browserWindow.webContents.send("menu.new");
    }
  }

  // This method will be called when Electron has finished
  // initialization and is ready to create browser windows.
  // Some APIs can only be used after this event occurs.
  private async handleReady(): Promise<void> {
    const template = [
      // { role: 'appMenu' }
      ...(isMac
        ? [
            {
              label: app.name,
              submenu: [
                { role: "about" },
                { type: "separator" },
                {
                  label: "Preferences",
                  submenu: [
                    {
                      id: "connections",
                      label: "Connections",
                      accelerator: "CommandOrControl+C",
                      click: (
                        _menuItem: MenuItem,
                        browserWindow: BrowserWindow
                      ) => {
                        browserWindow.webContents.send("menu.connections");
                      }
                    },
                    {
                      id: "settings",
                      label: "Settings",
                      accelerator: "CommandOrControl+S",
                      click: (
                        _menuItem: MenuItem,
                        browserWindow: BrowserWindow
                      ) => {
                        browserWindow.webContents.send("menu.settings");
                      }
                    }
                  ]
                },
                { type: "separator" },
                { role: "services" },
                { type: "separator" },
                { role: "hide" },
                { role: "hideothers" },
                { role: "unhide" },
                { type: "separator" },
                { role: "quit" }
              ]
            }
          ]
        : []),
      // { role: 'fileMenu' }
      {
        label: "File",
        submenu: [
          {
            label: "New Query",
            accelerator: "CommandOrControl+N",
            click: async (
              _menuItem: MenuItem,
              browserWindow: BrowserWindow | undefined
            ) => {
              if (!browserWindow) {
                this.createWindow();
              } else {
                browserWindow.webContents.send("menu.new");
              }
            }
          },
          {
            label: "New Window",
            accelerator: "Shift+CommandOrControl+N",
            click: async () => {
              const browserWindow = await this.createWindow();
              browserWindow.webContents.send("menu.new");
            }
          },
          { type: "separator" },
          {
            label: "Open...",
            accelerator: "CommandOrControl+O",
            click: async (_: MenuItem, browserWindow: BrowserWindow) => {
              // Invoke the operating system file open dialog
              const r = await dialog.showOpenDialog(browserWindow, {
                properties: ["openFile"],
                filters: [{ name: "Query Files", extensions: ["sql"] }]
              });

              if (r.canceled || r.filePaths.length === 0) {
                return;
              }

              this.openFile(r.filePaths[0], browserWindow);
            }
          },
          {
            label: "Open Recent",
            role: "recentdocuments",
            submenu: [
              {
                label: "Clear Recently Opened",
                role: "clearrecentdocuments"
              }
            ]
          },
          { type: "separator" },
          {
            id: "save",
            label: "Save",
            accelerator: "CommandOrControl+S",
            click: (_menuItem: MenuItem, browserWindow: BrowserWindow) => {
              if (!browserWindow) {
                return;
              }

              browserWindow.webContents.send("menu.save");
            }
          },
          {
            id: "saveAs",
            label: "Save As...",
            accelerator: "Shift+CommandOrControl+S",
            click: async (_: MenuItem, browserWindow: BrowserWindow) => {
              if (!browserWindow) {
                return;
              }

              browserWindow.webContents.send("menu.saveAs");
            }
          },
          { type: "separator" },
          {
            id: "closeEditor",
            label: "Close Editor",
            accelerator: "CommandOrControl+W",
            click: (_menuItem: MenuItem, browserWindow: BrowserWindow) => {
              if (!browserWindow) {
                return;
              }

              browserWindow.webContents.send("menu.closeSelectedEditor");
            }
          },
          isMac ? { role: "close" } : { role: "quit" }
        ]
      },
      //{ role: "editMenu" },
      {
        id: "edit",
        label: "Edit",
        submenu: [
          {
            id: "undo",
            label: "Undo",
            accelerator: "CommandOrControl+Z",
            click: (_menuItem: MenuItem, browserWindow: BrowserWindow) => {
              browserWindow.webContents.send("menu.undo");
            }
          },
          {
            id: "redo",
            label: "Redo",
            accelerator: "Shift+CommandOrControl+Z",
            click: (_menuItem: MenuItem, browserWindow: BrowserWindow) => {
              browserWindow.webContents.send("menu.redo");
            }
          },
          { type: "separator" },
          { role: "cut" },
          { role: "copy" },
          { role: "paste" },
          { role: "delete" },
          ...(isMac
            ? [{ role: "selectAll" }, { type: "separator" }]
            : [
                { type: "separator" },
                { role: "selectAll" },
                { type: "separator" }
              ]),
          {
            id: "find",
            label: "Find",
            accelerator: "CommandOrControl+F",
            click: (_menuItem: MenuItem, browserWindow: BrowserWindow) => {
              browserWindow.webContents.send("menu.find");
            }
          },
          {
            id: "replace",
            label: "Replace",
            accelerator: "Option+CommandOrControl+F",
            click: (_menuItem: MenuItem, browserWindow: BrowserWindow) => {
              browserWindow.webContents.send("menu.replace");
            }
          }
          //{ role: "replace" }
        ]
      },
      {
        label: "Query",
        submenu: [
          {
            id: "run",
            label: "Run",
            accelerator: "F5",
            click: (_menuItem: MenuItem, browserWindow: BrowserWindow) => {
              browserWindow.webContents.send("menu.run");
            }
          },
          {
            id: "stop",
            label: "Stop",
            accelerator: "Shift+F5",
            click: (_menuItem: MenuItem, browserWindow: BrowserWindow) => {
              browserWindow.webContents.send("menu.stop");
            }
          },
          {
            id: "export",
            label: "Export",
            accelerator: "CommandOrControl+E",
            click: async (_: MenuItem, browserWindow: BrowserWindow) => {
              if (!browserWindow) {
                return;
              }

              const r = await dialog.showSaveDialog(browserWindow, {
                properties: [],
                filters: [{ name: "CSV Files", extensions: ["csv"] }]
              });

              if (r.canceled || !r.filePath) {
                return;
              }

              browserWindow.webContents.send("menu.export", r.filePath);
            }
          }
        ]
      },
      { role: "windowMenu" },
      {
        role: "help",
        submenu: [
          {
            label: "Learn More",
            click: async () => {
              await shell.openExternal("http://cequel.space");
            }
          }
        ]
      },
      {
        label: "Debug",
        submenu: [
          { role: "reload" },
          { role: "forcereload" },
          { role: "toggledevtools" }
        ]
      }
    ];

    const menu = Menu.buildFromTemplate(
      template as Electron.MenuItemConstructorOptions[]
    );
    Menu.setApplicationMenu(menu);

    if (isDevelopment && !process.env.IS_TEST) {
      // Install Vue Devtools
      try {
        installExtension(VUEJS_DEVTOOLS);
      } catch (e) {
        console.error("Vue Devtools failed to install:", e.toString());
      }
    }

    createProtocol("app");

    // Create the window with a new tab
    const browserWindow = await this.createWindow();
    browserWindow.webContents.send("menu.new");
  }

  private async handleOpenFile(event: Event, path: string): Promise<void> {
    event.preventDefault();

    const currentWindow = BrowserWindow.getFocusedWindow();

    if (isMac) {
      this.openFile(path, currentWindow);
    } else {
      this.openFile(process.argv[0], currentWindow);
    }
  }

  private createWindow(): Promise<BrowserWindow> {
    const preload =
      process.env.NODE_ENV === "development"
        ? // eslint-disable-next-line no-undef
          path.resolve(__static, "..", "src", "preload.js") // dev
        : // eslint-disable-next-line no-undef
          path.join(__dirname, "preload.js"); // prod
    let x, y, width, height;

    // Base the initial position on the currently focused window if there is one.
    const currentWindow = BrowserWindow.getFocusedWindow();

    if (currentWindow) {
      const bounds = currentWindow.getBounds();
      x = bounds.x + 40;
      y = bounds.y + 40;
      width = bounds.width;
      height = bounds.height;
    } else {
      // When there isn't an existing window, default to 80% of the screen size
      const display = screen.getPrimaryDisplay();
      const size = display.size;

      x = size.width * 0.1;
      y = size.height * 0.1;
      width = size.width * 0.8;
      height = size.height * 0.8;
    }

    // Create the browser window.
    const window: BrowserWindow = new BrowserWindow({
      x: x,
      y: y,
      show: false,
      backgroundColor: "#08090d", // Copied from $color-0
      width: width,
      height: height,
      title: app.name,
      webPreferences: {
        // Use pluginOptions.nodeIntegration, leave this alone
        // See nklayman.github.io/vue-cli-plugin-electron-builder/guide/security.html#node-integration for more info
        nodeIntegration: (process.env
          .ELECTRON_NODE_INTEGRATION as unknown) as boolean,
        preload
      }
    });

    // Capture the webContents.id here so that it is passed into to the 'closed' event handler
    // in the closures below.  This allows us to remove the menu states after the webContents has been
    // destroyed.
    const webContentsId = window.webContents.id;

    // Keep a reference to the window so its not garbage collected until it is closed
    this.windows.add(window);

    // Keep a promise to resolve when the renderer process indicates its IPC handler is ready
    const promise = new WindowPromise(window);
    this.windowPromises.set(webContentsId, promise);

    window.once("ready-to-show", () => {
      window.show();
    });

    window.on("close", () => {
      window.webContents.send("menu.close");
    });

    window.on("closed", () => {
      // Cleanup the state for the window
      this.menuStates.delete(webContentsId);
      this.windows.delete(window);
    });

    window.on("focus", () => {
      // Apply the recorded menu states to the main menu bar
      const states = this.menuStates.get(webContentsId);
      if (states) {
        const mainMenu = Menu.getApplicationMenu();
        if (mainMenu) {
          for (const pair of states) {
            const menuItem = mainMenu.getMenuItemById(pair[0]);
            if (menuItem) {
              menuItem.enabled = !pair[1];
            }
          }
        }
      }
    });

    if (process.env.WEBPACK_DEV_SERVER_URL) {
      // Load the url of the dev server if in development mode
      window.loadURL(process.env.WEBPACK_DEV_SERVER_URL);
      //if (!process.env.IS_TEST) {
      //  window.webContents.openDevTools();
      //}
    } else {
      // Load the index.html when not in development
      window.loadURL("app://./index.html");
    }

    // Enable all the menus that need to be enabled when a window is created
    const mainMenu = Menu.getApplicationMenu();
    if (mainMenu) {
      mainMenu.getMenuItemById("save").enabled = true;
      mainMenu.getMenuItemById("saveAs").enabled = true;
      mainMenu.getMenuItemById("closeEditor").enabled = true;
    }

    return promise.promise;
  }

  private async openFile(
    fileName: string,
    window: BrowserWindow | null
  ): Promise<void> {
    // Start loading the file
    const contentPromise = readFileAsync(fileName);

    if (!window) {
      window = await this.createWindow();
    }

    // Update the window title
    app.addRecentDocument(fileName);

    // Send the file contents into the render process
    const content = (await contentPromise).toString();
    window.webContents.send("menu.open", fileName, content);
  }
}
