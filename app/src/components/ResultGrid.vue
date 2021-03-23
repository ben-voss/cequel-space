<template>
  <ag-grid-vue
    :class="'ag-theme-alpine' + ($vuetify.theme.dark ? '-dark' : '')"
    :defaultColDef="defaultColDef"
    :suppressHorizontalScroll="false"
    @grid-ready="onGridReady"
  >
  </ag-grid-vue>
</template>

<script lang="ts">
import GridData from "@/model/GridData";
import { Vue, Component, Prop, Watch } from "vue-property-decorator";
import {
  ColDef,
  ColumnApi,
  GridApi,
  GridReadyEvent
} from "@ag-grid-community/core";
import { AgGridVue } from "@ag-grid-community/vue";

@Component({
  components: {
    AgGridVue
  }
})
export default class ResultGrid extends Vue {
  private columnApi!: ColumnApi;
  private gridApi!: GridApi;

  private defaultColDef: ColDef = {
    sortable: true,
    filter: true,
    resizable: true,
    valueFormatter: p => {
      return p.value !== null ? p.value : "NULL";
    },
    cellStyle: p => {
      return p.value !== null ? null : { backgroundColor: "#333333" };
    }
  };

  @Prop({
    type: Object as () => GridData,
    default: () => {
      return null;
    }
  })
  gridData!: GridData;

  private onGridReady(params: GridReadyEvent): void {
    this.gridApi = params.api;
    this.columnApi = params.columnApi;

    if (this.gridData) {
      this.gridApi.setColumnDefs(this.gridData.columnDefs);

      if (this.gridData.rowData == null) {
        this.gridApi.showLoadingOverlay();
      } else if (this.gridData.rowData.length === 0) {
        this.gridApi.setRowData([]);
        this.gridApi.showNoRowsOverlay();
      } else {
        this.gridApi.setRowData(this.gridData.rowData);
      }
    }
  }

  @Watch("gridData")
  private handleGridDataChange(
    newValue: GridData,
    oldValue: GridData | undefined = undefined
  ) {
    if (this.columnApi && oldValue) {
      oldValue.gridColumnState = this.columnApi.getColumnState();

      const gridPanel = (this.gridApi as any).gridPanel;
      oldValue.scrollLeft = gridPanel.scrollLeft;
      oldValue.scrollTop = gridPanel.scrollTop;
    }

    if (this.columnApi && newValue) {
      // First, clear the row data
      this.gridApi.setRowData([]);

      // Ensure to always set the column defs before
      // setting the column state
      this.gridApi.setColumnDefs(newValue.columnDefs);
      this.columnApi.applyColumnState({
        state: newValue.gridColumnState
      });

      // Set the data
      if (newValue.rowData == null) {
        this.gridApi.showLoadingOverlay();
      } else if (newValue.rowData.length === 0) {
        this.gridApi.showNoRowsOverlay();
      } else {
        this.gridApi.setRowData(newValue.rowData);
      }

      // Set the scroll positions
      const gridPanel = (this.gridApi as any).gridPanel;
      gridPanel.doHorizontalScroll(newValue.scrollLeft);
      gridPanel.setVerticalScrollPosition(newValue.scrollTop);
    }
  }
}
</script>
