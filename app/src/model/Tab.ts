import GridData from "./GridData";
import { v1 as uuid } from "uuid";
import { EditSession, IEditSession, UndoManager } from "brace";
import BatchJob from "./BatchJob";
import Connection from "./Connection";
import Api from "@/api/Api";
import { ValueGetterParams } from "@ag-grid-community/core";
import { Symbols } from "@/di";
import { inject } from "inversify";
import AppState from "@/store/AppState";
import { Store } from "vuex";

export default class Tab {
  private readonly api: Api;
  private readonly store: Store<AppState>;
  private readonly undoManager: UndoManager = new UndoManager();

  private batchJob: BatchJob | null = null;

  public executionTime = "";
  public selectedText = "";
  public selectedGrid = 0;
  public lineNumber = 0;
  public columnNumber = 0;

  public id: string;
  public name = "New Query";
  public fileName: string | null = null;
  public error: null | string = null;
  public grids: GridData[] = [new GridData(0, [], [])];
  public readonly session: IEditSession = new EditSession(
    "",
    "ace/mode/sqlserver"
  );

  constructor(
    @inject(Symbols.Api) api: Api,
    @inject(Symbols.Store) store: Store<AppState>
  ) {
    this.api = api;
    this.store = store;
    this.id = uuid();

    this.session.setUndoManager(this.undoManager);
  }

  public get sqlText(): string {
    return this.session.getValue();
  }

  public set sqlText(value: string) {
    this.session.setValue(value);
  }

  private get connection(): Connection {
    return this.store.getters["connections/selected"] as Connection;
  }

  public get runDisabled(): boolean {
    return (
      this.connection === null ||
      this.batchJob !== null ||
      this.session.getValue().length === 0
    );
  }

  public async run(): Promise<void> {
    if (!this.connection) {
      return;
    }

    if (!this.connection.id) {
      return;
    }

    this.executionTime = "00:00.00";
    const startTime = new Date();

    const elapsedTimeIntervalRef = setInterval(() => {
      this.updateExecutionTime(startTime, new Date());
    }, 10); // 10 as in 10 milliseconds

    this.grids = [new GridData(0, [], null)];
    this.error = null;
    this.selectedGrid = 0;

    try {
      this.batchJob = await this.api.addBatchJob({
        id: undefined,
        connectionId: this.connection.id,
        query: this.selectedText.length > 0 ? this.selectedText : this.sqlText
      });

      const recordSets = await this.api.getBatchJob(this.batchJob.id!);

      this.batchJob = null;

      clearInterval(elapsedTimeIntervalRef);
      this.updateExecutionTime(startTime, new Date());

      if (recordSets.length === 0) {
        this.grids = [new GridData(0, [], [])];
      } else {
        this.grids = [];
        for (let i = 0; i < recordSets.length; i++) {
          const recordSet = recordSets[i];

          if (recordSet.message) {
            this.grids.push(new GridData(i, [], null, recordSet.message));
          } else if (recordSet.headers) {
            // Create the headers
            const columnDefs = recordSet.headers.map((h, i) => {
              return {
                headerName: h,
                valueGetter: (p: ValueGetterParams) => {
                  return p.data[i];
                }
              };
            });

            // Set the data.
            this.grids.push(new GridData(i, columnDefs, recordSet.data));
          }
        }
      }
    } catch (error) {
      // Set the error text
      if (error.response) {
        this.error = error.response.data.detail;
      } else {
        this.error = error;
      }

      // Clear the timer and reset the request tokens
      clearInterval(elapsedTimeIntervalRef);
      this.updateExecutionTime(startTime, new Date());
      this.batchJob = null;
    }
  }

  private updateExecutionTime(startTime: Date, endTime: Date): void {
    let timeDiff = endTime.getTime() - startTime.getTime();

    timeDiff = timeDiff / 100;
    const milliseconds = Math.floor(timeDiff % 60);
    const millisecondsAsString =
      milliseconds < 10 ? "0" + milliseconds : milliseconds;

    timeDiff = timeDiff / 10;
    const seconds = Math.floor(timeDiff % 60);
    const secondsAsString = seconds < 10 ? "0" + seconds : seconds;

    timeDiff = Math.floor(timeDiff / 60);
    const minutes = timeDiff % 60;
    const minutesAsString = minutes < 10 ? "0" + minutes : minutes;

    timeDiff = Math.floor(timeDiff / 60);
    const hours = timeDiff % 24;

    timeDiff = Math.floor(timeDiff / 24);
    const days = timeDiff;
    const totalHours = hours + days * 24; // add days to hours
    const totalHoursAsString = totalHours < 10 ? "0" + totalHours : totalHours;

    if (totalHoursAsString === "00") {
      this.executionTime =
        minutesAsString + ":" + secondsAsString + "." + millisecondsAsString;
    } else {
      this.executionTime =
        totalHoursAsString +
        ":" +
        minutesAsString +
        ":" +
        secondsAsString +
        "." +
        millisecondsAsString;
    }
  }

  public get stopDisabled(): boolean {
    return this.batchJob === null;
  }

  public stop(): void {
    // Delete the job from the server
    if (this.batchJob) {
      this.api.deleteBatchJob(this.batchJob.id!);
      this.batchJob = null;
    }
  }

  public handleGridFocus(index: number): void {
    this.selectedGrid = index;
  }

  public haveRowData(): boolean {
    return (
      this.executionTime != "" &&
      this.grids &&
      this.grids.length > this.selectedGrid &&
      this.grids[this.selectedGrid].rowData !== null
    );
  }
}
