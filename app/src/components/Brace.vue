<template>
  <div id="vue-brace"></div>
</template>

<script lang="ts">
import { Vue, Component, Prop, Watch } from "vue-property-decorator";
import brace from "brace";
import "brace/ext/language_tools";
import "brace/mode/sqlserver";
import "brace/theme/monokai";
import "brace/theme/sqlserver";
import "brace/ext/searchbox";
import { State } from "vuex-class";
import TreeNode from "@/model/nodes/TreeNode";
import Tab from "@/model/Tab";
import FindCommand from "../commands/FindCommand";
import ReplaceCommand from "../commands/ReplaceCommand";

export interface Completion {
  name: string;
  value: string;
  score: number;
  meta: string;
}

interface Token extends brace.TokenInfo {
  type: string;
}

@Component({})
export default class Brace extends Vue {
  private findCommand!: FindCommand;
  private replaceCommand!: ReplaceCommand;

  @State("procedures", { namespace: "schema" }) procedures!: TreeNode[];
  @State("views", { namespace: "schema" }) views!: TreeNode[];
  @State("tables", { namespace: "schema" }) tables!: TreeNode[];
  @State("triggers", { namespace: "schema" }) triggers!: TreeNode[];

  editor!: brace.Editor;
  schemaCompletions: Completion[] = [];

  @Prop({
    type: Object as () => Tab,
    default: () => {
      return null;
    }
  })
  tab!: Tab;

  @Prop({
    type: Boolean,
    default: true
  })
  dark!: boolean;

  setTheme() {
    if (this.dark) {
      this.editor.setTheme("ace/theme/monokai");
    } else {
      this.editor.setTheme("ace/theme/sqlserver");
    }
  }

  handleSelection() {
    this.tab.selectedText = this.editor.getCopyText();
  }

  handleCursor() {
    const cursor = this.editor.getCursorPosition();

    this.tab.lineNumber = cursor.row;
    this.tab.columnNumber = cursor.column;
  }

  resize() {
    this.editor.resize();
  }

  mounted() {
    this.editor = brace.edit("vue-brace");
    this.setTheme();
    this.editor.$blockScrolling = Infinity;
    this.editor.setOptions({
      showPrintMargin: false,
      enableBasicAutocompletion: [
        {
          getCompletions: this.handleCompletions
        }
      ],
      enableLiveAutocompletion: true
    });

    this.findCommand = new FindCommand(this.$store, this.editor);
    this.replaceCommand = new ReplaceCommand(this.$store, this.editor);

    this.handleTabChanged(this.tab, null);
  }

  private handleSelectionEvent = () => this.handleSelection();
  private handleCursorEvent = () => this.handleCursor();

  @Watch("tab")
  handleTabChanged(newVal: Tab, oldVal: Tab | null) {
    if (newVal.session != this.editor.getSession()) {
      this.editor.setSession(newVal.session);

      newVal.session.selection.on("changeSelection", this.handleSelectionEvent);
      newVal.session.selection.on("changeCursor", this.handleCursorEvent);

      if (oldVal) {
        oldVal.session.selection.removeEventListener("changeSelection", this.handleSelectionEvent);
        oldVal.session.selection.removeEventListener("changeCursor", this.handleCursorEvent);
      }

      this.handleSelection();
      this.handleCursor();
    }
  }

  @Watch("dark")
  handleDark() {
    this.setTheme();
  }

  @Watch("theme")
  handleTheme() {
    this.setTheme();
  }

  @Watch("tables")
  handleTablesChange() {
    this.updateCompletions();
  }

  @Watch("procedures")
  handleProceduresChange() {
    this.updateCompletions();
  }

  @Watch("views")
  handleViewsChange() {
    this.updateCompletions();
  }

  @Watch("triggers")
  handleTriggersChange() {
    this.updateCompletions();
  }

  private updateCompletions() {
    this.schemaCompletions = [
      ...this.tables.map(table => {
        return {
          name: table.name,
          value: table.name,
          score: 1,
          meta: "table"
        };
      }),
      ...this.procedures.map(procedure => {
        return {
          name: procedure.name,
          value: procedure.name,
          score: 1,
          meta: "procedure"
        };
      }),
      ...this.triggers.map(trigger => {
        return {
          name: trigger.name,
          value: trigger.name,
          score: 1,
          meta: "trigger"
        };
      }),
      ...this.views.map(view => {
        return {
          name: view.name,
          value: view.name,
          score: 1,
          meta: "view"
        };
      })
    ];
  }

  private handleCompletions(
    _editor: brace.Editor,
    session: brace.IEditSession,
    pos: brace.Position,
    _prefix: string,
    callback: (error: any, completions: Completion[]) => void
  ) {
    // Do not auto complete in comments, operators, strings or numbers
    const token = session.getTokenAt(pos.row, pos.column) as Token;
    if (
      token &&
      (/comment/.test(token.type) ||
        /numeric/.test(token.type) ||
        /string/.test(token.type) ||
        /operator/.test(token.type))
    ) {
      return;
    }

    // Get all the completions defined by the language plugin
    const pluginCompletions = (session.$mode as any).$highlightRules
      .completions;

    // Add the completions defined by the database schema
    callback(null, [...pluginCompletions, ...this.schemaCompletions]);
  }

  public focus(): void {
    this.editor.focus();
  }
}
</script>
