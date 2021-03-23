<template>
  <Main></Main>
</template>

<script lang="ts">
import { Vue, Component } from "vue-property-decorator";
import { State, Getter } from "vuex-class";
import Main from "./Main.vue";
import Tab from "@/model/Tab";
import { LazyInject, Symbols } from "@/di";
import Api from "@/api/Api";

@Component({
  components: {
    Main
  }
})
export default class BrowserMain extends Vue {
  @LazyInject(Symbols.Api)
  private api!: Api;

  @State("tabs", { namespace: "tabs" })
  tabs!: Tab[];

  @Getter("selected", { namespace: "tabs" })
  selectedTab!: Tab | null;

  async beforeMount(): Promise<void> {
    // Indicate to the main process that the window is ready to receive IPC messages.
    window.ipcRenderer.send("READY");

    // Handle saving when closing
    window.onclose = async (e: Event) => {
      const dirtyTabs = this.tabs.filter(
        t => !t.session.getUndoManager().isClean
      );

      if (dirtyTabs.length === 0) {
        return;
      }

      let message;
      let detail: string;
      if (dirtyTabs.length === 1) {
        message = "Do you want to save the changes you made to " + dirtyTabs[0].name + "?";
        detail = "Your changes will be lost if you don't save them.";
      } else {
        message = "Do you want to save the changes to the following " + dirtyTabs.length + " files?";

        detail = "";
        dirtyTabs.forEach(t => detail += t.name + "\n");

        detail = "Your changes will be lost if you don't save them.";
      }

      const response = await this.api.messageBox({
        type: "question",
        buttons: ["Save", "Don't Save", "Cancel"],
        message,
        detail,
        cancelId: 2
      });

      if (response === 0) {
        // Save
        dirtyTabs.forEach(async tab => {
          if (tab.fileName) {
            this.api.save(tab.fileName, tab.sqlText, "sql");
            tab.session.getUndoManager().markClean();
          } else {
            const fileName = await this.api.saveAs(tab.sqlText, "sql");
            if (fileName) {
              tab.session.getUndoManager().markClean();

              if (tab.id === this.selectedTab?.id) {
                this.api.setRepresentedFilename(fileName);
              }
            } else {
              e.preventDefault();
              return;
            }
          }
        });
      } else if (response === 1) {
        // Don't save
      } else if (response === 2) {
        // Cancel
        e.preventDefault();
      }
    };
  }
}
</script>
