import { mdiTableArrowDown } from "@mdi/js";
import Tab from "@/model/Tab";
import Command from "./Command";
import BaseCommand from "./BaseCommand";
import { extname, basename, dirname } from "path";
import GridData from "@/model/GridData";
import { Store } from "vuex";
import { inject, injectable } from "inversify";
import { Symbols } from "@/di";
import AppState from "@/store/AppState";
import Api from "@/api/Api";

@injectable()
export default class ExportCommand extends BaseCommand implements Command {
  private api: Api;
  private store: Store<AppState>;

  constructor(
    @inject(Symbols.Api) api: Api,
    @inject(Symbols.Store) store: Store<AppState>
  ) {
    super("export", "Export", mdiTableArrowDown);

    this.api = api;
    this.store = store;
  }

  private get selectedTab(): Tab | null {
    return this.store.getters["tabs/selected"] as Tab | null;
  }

  public get isDisabled(): boolean {
    const tab = this.selectedTab;
    if (!tab) {
      return true;
    }

    return (
      tab.executionTime == "" ||
      tab.grids === null ||
      tab.grids.length === 0 ||
      tab.grids[0].columnDefs === null
    );
  }

  public ipcRendererAction(args: string[]): void {
    const tab = this.selectedTab;
    if (!tab) {
      return;
    }

    for (let i = 0; i < tab.grids.length; i++) {
      const csvString = this.generateCsvData(tab.grids[i]);

      if (tab.grids.length === 1) {
        this.api.save(args[0], csvString, "csv");
      } else {
        const extension = extname(args[0]);
        const file = basename(args[0], extension);
        const dir = dirname(args[0]);

        this.api.save(dir + "/" + file + "-" + (i + 1) + extension, csvString, "csv");
      }
    }
  }

  public action(): void {
    const tab = this.selectedTab;
    if (!tab) {
      return;
    }

    for (let i = 0; i < tab.grids.length; i++) {
      const csvString = this.generateCsvData(tab.grids[i]);

      if (tab.grids.length === 1) {
        this.api.save(tab.name + ".csv", csvString, "csv");
      } else {
        this.api.save(tab.name + "-" + (i + 1) + ".csv", csvString, "csv");
      }
    }
  }

  private generateCsvData(grid: GridData): string {
    // Generate the header
    let csvString = "";
    grid.columnDefs?.forEach((c, i) => {
      if (i !== 0) {
        csvString += ",";
      }
      csvString += c.headerName;
    });
    csvString += "\n";

    // Append all the data (nulls are skipped)
    grid.rowData?.forEach(r => {
      r.forEach((e, i) => {
        if (i !== 0) {
          csvString += ",";
        }

        if (e !== null) {
          csvString += e;
        }
      });
      csvString += "\n";
    });

    return csvString;
  }
}
