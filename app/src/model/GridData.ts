import { ColDef, ColumnState } from "@ag-grid-community/core";

export default class GridData {
  public i: number;
  public columnDefs: ColDef[] = [];
  public rowData: unknown[][] | null = null;
  public gridColumnState: ColumnState[] = [];
  public scrollLeft = -1;
  public scrollTop = -1;
  public message: string | undefined;

  constructor(
    i: number,
    columnDefs: ColDef[] | undefined = undefined,
    rowData: unknown[][] | null | undefined = undefined,
    message: string | undefined = undefined
  ) {
    this.i = i;
    this.message = message;

    if (columnDefs !== undefined && rowData !== undefined) {
      // We use Object.freeze to prevent Vue from attaching observers to it.
      // This saves memory and time since the data will never change.
      this.columnDefs = (Object.freeze(columnDefs) as unknown[]) as ColDef[];

      if (rowData !== null) {
        this.rowData = Object.freeze(rowData) as unknown[][];
      } else {
        this.rowData = null;
      }
    } else {
      this.rowData = null;
      this.columnDefs = [];
    }
  }
}
