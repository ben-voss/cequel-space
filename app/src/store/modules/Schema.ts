import { Module } from "vuex";
import Connection from "@/model/Connection";
import BatchJob from "@/model/BatchJob";
import ProcedureNode from "@/model/nodes/ProcedureNode";
import TableNode from "@/model/nodes/TableNode";
import ViewNode from "@/model/nodes/ViewNode";
import TriggerNode from "@/model/nodes/TriggerNode";
import ColumnNode from "@/model/nodes/ColumnNode";
import container, { Symbols } from "@/di";
import Api from "@/api/Api";
import AppState from "../AppState";

export interface SchemaState {
  procedures: ProcedureNode[];
  views: ViewNode[];
  tables: TableNode[];
  triggers: TriggerNode[];
  columnsByTable: Map<number, ColumnNode[]>;
}

export default function schemaStateFactory(): Module<SchemaState, AppState> {
  return {
    namespaced: true,
    state: {
      procedures: [],
      views: [],
      tables: [],
      triggers: [],
      columnsByTable: new Map()
    },
    getters: {
      table(state): (tableId: number) => TableNode | null {
        return (tableId: number) => {
          return state.tables.find(x => x.tableId === tableId) || null;
        };
      },
      columnsForTable(state): (tableId: number) => ColumnNode[] {
        return (tableId: number) => {
          return state.columnsByTable.get(tableId) || [];
        };
      }
    },
    mutations: {
      proceduresLoaded(state, procedures: ProcedureNode[]): void {
        state.procedures = procedures;
      },
      viewsLoaded(state, views: ViewNode[]): void {
        state.views = views;
      },
      tablesLoaded(state, tables: TableNode[]): void {
        state.tables = tables;
      },
      triggersLoaded(state, triggers: TriggerNode[]): void {
        state.triggers = triggers;
      },
      columnsForTable(
        state,
        args: { tableId: number; columns: ColumnNode[] }
      ): void {
        state.columnsByTable.set(args.tableId, args.columns);
      }
    },
    actions: {
      async load(context): Promise<void> {
        const api = container.get(Symbols.Api) as Api;

        const query =
          "select t.object_id, s.name + '.' + t.name from sys.tables t left join sys.schemas s on s.schema_id = t.schema_id where t.type = 'U';" +
          "select p.object_id, s.name + '.' + p.name from sys.procedures p join sys.schemas s on s.schema_id = p.schema_id;" +
          "SELECT v.object_id, OBJECT_SCHEMA_NAME(v.object_id) + '.' + v.name FROM sys.views as v;" +
          "select t.object_id, p.name + '.' + t.name from sys.triggers t join sys.objects p on p.object_id = t.parent_id;";

        context.commit("tablesLoaded", []);
        context.commit("proceduresLoaded", []);
        context.commit("viewsLoaded", []);
        context.commit("triggersLoaded", []);

        const selectedConnection = context.rootGetters[
          "connections/selected"
        ] as Connection | null;

        if (!selectedConnection) {
          return;
        }

        console.assert(selectedConnection.id !== undefined);

        let job: BatchJob = {
          id: undefined,
          connectionId: selectedConnection.id as string,
          query: query
        };

        try {
          job = await api.addBatchJob(job);

          const recordSets = await api.getBatchJob(job.id!);

          if (recordSets[0].data) {
            const tableNodeFactory = container.get(Symbols.TableNodeFactory) as (id: number, name: string) => TableNode;

            context.commit(
              "tablesLoaded",
              recordSets[0].data.map(
                r => tableNodeFactory(r[0] as number, r[1] as string)
              )
            );
          }

          if (recordSets[1].data) {
            const procedureNodeFactory = container.get(Symbols.ProcedureNodeFactory) as (id: number, name: string) => ProcedureNode;

            context.commit(
              "proceduresLoaded",
              recordSets[1].data.map(
                r => procedureNodeFactory(r[0] as number, r[1] as string)
              )
            );
          }

          if (recordSets[2].data) {
            const viewNodeFactory = container.get(Symbols.ViewNodeFactory) as (id: number, name: string) => ViewNode;

            context.commit(
              "viewsLoaded",
              recordSets[2].data.map(
                r => viewNodeFactory(r[0] as number, r[1] as string)
              )
            );
          }

          if (recordSets[3].data) {
            const triggerNodeFactory = container.get(Symbols.TriggerNodeFactory) as (id: number, name: string) => TriggerNode;

            context.commit(
              "triggersLoaded",
              recordSets[3].data.map(
                r => triggerNodeFactory(r[0] as number, r[1] as string)
              )
            );
          }
        } catch (error) {
          console.error(error);

          throw error;
        }
      },
      async getColumns(
        context,
        args: { tableId: number }
      ): Promise<ColumnNode[]> {
        const api = container.get(Symbols.Api) as Api;

        const table = context.state.tables.find(t => t.tableId === args.tableId);
        if (!table) {
          return [];
        }

        const selectedConnection = context.rootGetters[
          "connections/selected"
        ] as Connection | null;
        if (!selectedConnection) {
          return [];
        }

        let job: BatchJob = {
          id: undefined,
          connectionId: selectedConnection.id as string,
          query:
            "SELECT column_id, name FROM sys.columns WHERE object_id = " +
            args.tableId
        };

        job = await api.addBatchJob(job);
        const recordSet = await api.getBatchJob(job.id!);
        if (recordSet.length != 1 || !recordSet[0].data) {
          return [];
        }

        const columnNodeFactory = container.get(Symbols.ColumnNodeFactory) as (id: number, tableName: string, name: string) => ColumnNode;

        const columns = recordSet[0].data.map(
          r => columnNodeFactory(r[0] as number, table.name, r[1] as string)
        );

        context.commit("columnsForTable", {
          tableId: args.tableId,
          columns: columns
        });

        return columns;
      }
    }
  };
}
