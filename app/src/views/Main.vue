<template>
  <div style="position: relative; flex 1 1 auto; height: 100%">
    <v-app-bar clipped-left app dense>
      <template v-for="tool in tools" bottom>
        <v-tooltip v-if="!tool.title.startsWith('-')" :key="tool.title" bottom>
          <template v-slot:activator="{ on, attrs }">
            <v-btn
              icon
              @click.stop="tool.action"
              :disabled="tool.disabled"
              v-bind="attrs"
              v-on="on"
              width="42"
              height="42"
            >
              <v-icon>{{ tool.icon }}</v-icon>
            </v-btn>
          </template>
          <span>{{ tool.title }}</span>
        </v-tooltip>
        <v-divider v-else :key="tool.title" class="mx-1" vertical></v-divider>
      </template>
      <v-spacer></v-spacer>
      <v-btn
        class="mx-2"
        icon
        @click.stop="settingsVisible = !settingsVisible"
        width="42"
        height="42"
      >
        <v-icon>
          {{ mdiCogOutline }}
        </v-icon>
      </v-btn>

      <slot name="userInfo"></slot>
    </v-app-bar>

    <SettingsNav v-model="settingsVisible"></SettingsNav>

    <SchemaNav></SchemaNav>

    <ConnectionsEditor v-model="connectionsEditorVisible"></ConnectionsEditor>

    <TabBar></TabBar>

    <v-container
      class="fill-height no-gutters"
      style="padding: 0px; max-width: 100%"
    >
      <v-row class="no-gutters" style="height: 100%; margin-top: 0px">
        <v-col v-if="tabs.length > 0 && selectedTab">
          <splitpanes
            :class="$vuetify.theme.dark ? 'dark-theme' : 'light-theme'"
            @resize="$refs.brace.resize()"
            @resized="$refs.brace.resize()"
            horizontal
            style="position: relative; flex 1 1 auto; height: 100%"
          >
            <pane min-size="5">
              <brace
                ref="brace"
                style="position: relative; flex 1 1 auto; height: 100%"
                :tab="selectedTab"
                :dark="$vuetify.theme.dark"
              >
              </brace>
            </pane>
            <pane>
              <splitpanes
                :dark="$vuetify.theme.dark ? 'dark-theme' : 'light-theme'"
                horizontal
                style="position: relative; flex 1 1 auto; height: 100%"
              >
                <template v-if="!selectedTab.error">
                  <pane v-for="g in selectedTab.grids" :key="g.i" min-size="5">
                    <div
                      v-if="g.message"
                      style="position: relative; flex 1 1 auto; height: 100%"
                    >
                      {{ g.message }}
                    </div>
                    <div
                      v-else
                      style="position: relative; flex 1 1 auto; height: 100%"
                      @focusin="selectedTab.handleGridFocus(g.i)"
                      @click="selectedTab.handleGridFocus(g.i)"
                    >
                      <ResultGrid
                        style="position: relative; flex 1 1 auto; height: 100%"
                        :gridData="g"
                      >
                      </ResultGrid>
                    </div>
                  </pane>
                </template>
                <pane v-if="selectedTab.error" min-size="5">
                  <div
                    style="position: relative; flex 1 1 auto; height: 100%; white-space: pre; padding: 2px"
                    :class="
                      $vuetify.theme.dark ? 'dark-error-box' : 'light-error-box'
                    "
                  >
                    {{ selectedTab.error }}
                  </div>
                </pane>
              </splitpanes>
            </pane>
          </splitpanes>
        </v-col>
      </v-row>
    </v-container>
    <v-footer app style="font-size: small">
      <v-icon small style="margin-right: 2px">{{ mdiLanPending }}</v-icon>
      <template v-if="connection">
        {{ connection.name }}
      </template>
      <template v-else>
        No connection
      </template>
      <template v-if="selectedTab">
        <template v-if="selectedTab.executionTime !== ''">
          <v-icon small style="margin-left: 5px; margin-right: 2px">{{
            mdiTimerOutline
          }}</v-icon
          >{{ selectedTab.executionTime }}
        </template>
        <template v-if="selectedTab.haveRowData()">
          <v-icon small style="margin-left: 5px; margin-right: 2px">{{
            mdiSigma
          }}</v-icon
          >Sets {{ selectedTab.grids.length }}, Rows
          {{ selectedTab.grids[selectedTab.selectedGrid].rowData.length }}
        </template>
        <v-spacer></v-spacer>
        <v-icon small style="margin-right: 2px">{{
          mdiFileDocumentEditOutline
        }}</v-icon>
        Ln {{ selectedTab.lineNumber }}, Col {{ selectedTab.columnNumber }}
        <template v-if="selectedTab.selectedText.length > 0"
          >({{ selectedTab.selectedText.length }} selected)</template
        >
      </template>
    </v-footer>
  </div>
</template>

<script lang="ts">
import { Vue, Component, Watch } from "vue-property-decorator";
import { State, Action, Getter } from "vuex-class";
import Brace from "../components/Brace.vue";

import { Splitpanes, Pane } from "splitpanes";
import "splitpanes/dist/splitpanes.css";
import {
  mdiCogOutline,
  mdiTimerOutline,
  mdiFileDocumentEditOutline,
  mdiSigma,
  mdiFolder,
  mdiLanPending
} from "@mdi/js";
import ConnectionsEditor from "../components/ConnectionsEditor.vue";
import Connection from "../model/Connection";
import Tab from "../model/Tab";
import ResultGrid from "../components/ResultGrid.vue";
import TabBar from "../components/TabBar.vue";
import { Framework } from "vuetify";
import { VueCookies } from "vue-cookies";
import SettingsNav from "../components/SettingsNav.vue";
import UserInfo from "../components/UserInfo.vue";
import SchemaNav from "../components/SchemaNav.vue";
import { Store } from "vuex";
import ConnectionsCommand from "../commands/ConnectionsCommand";
import SettingsCommand from "../commands/SettingsCommand";
import container, { LazyInject, Symbols } from "../di";
import AppState from "../store/AppState";
import Api from "@/api/Api";

declare module "vue-property-decorator/lib/vue-property-decorator" {
  interface Vue {
    $vuetify: Framework;
    $cookies: VueCookies;
    $store: Store<AppState>;
  }
}

@Component({
  components: {
    Brace,
    Splitpanes,
    Pane,
    ConnectionsEditor,
    ResultGrid,
    TabBar,
    SettingsNav,
    UserInfo,
    SchemaNav
  }
})
export default class Main extends Vue {
  private mdiCogOutline = mdiCogOutline;
  private mdiTimerOutline = mdiTimerOutline;
  private mdiFileDocumentEditOutline = mdiFileDocumentEditOutline;
  private mdiSigma = mdiSigma;
  private mdiFolder = mdiFolder;
  private mdiLanPending = mdiLanPending;

  @LazyInject(Symbols.Api)
  private api!: Api;

  // All the commands that the UI can process but don't appear on the toolbar
  private commands = {
    saveAs: container.get(Symbols.SaveAsCommand),
    closeEditor: container.get(Symbols.CloseSelectedEditorCommand),
    settings: new SettingsCommand(this.showSettings)
  };

  // Layout of the toolbar
  private tools = [
    new ConnectionsCommand(this.showConnectionsEditor),
    {
      title: "-0"
    },
    container.get(Symbols.NewCommand),
    container.get(Symbols.OpenCommand),
    container.get(Symbols.SaveCommand),
    {
      title: "-1"
    },
    container.get(Symbols.RunCommand),
    container.get(Symbols.StopCommand),
    container.get(Symbols.ExportCommand),
    {
      title: "-2"
    },
    container.get(Symbols.CutCommand),
    container.get(Symbols.CopyCommand),
    container.get(Symbols.PasteCommand),
    {
      title: "-3"
    },
    container.get(Symbols.UndoCommand),
    container.get(Symbols.RedoCommand)
  ];

  private connectionsEditorVisible = false;
  private settingsVisible = false;

  @State("tabs", { namespace: "tabs" })
  tabs!: Tab[];

  @Getter("selected", { namespace: "tabs" })
  selectedTab!: Tab | null;

  @Watch("selectedTab")
  private handleSelectedTabChange() {
    // Update the window title with the file name
    this.updateTitle();

    // Push the input focus to the text editor
    // When creating the first tab we don't have an instance
    // of the Brace component yet so we push this to the next tick
    this.$nextTick(() => {
      const brace = this.$refs.brace as Brace;

      // When deleting the last tab we end up with nothing
      if (brace) {
        brace.focus();
      }
    });
  }

  @Action("add", { namespace: "tabs" })
  addTab!: (args: { tab: Tab }) => Promise<Tab>;

  @Action("delete", { namespace: "tabs" })
  deleteTab!: (args: { tab: Tab }) => Promise<Tab>;

  @State("connections", { namespace: "connections" })
  connections!: Connection[];

  @State("loaded", { namespace: "connections" })
  connectionsLoaded!: boolean;

  @Getter("selected", { namespace: "connections" })
  connection!: Connection;

  beforeMount(): void {
    // Show the connections editor when the connections have loaded but are empty
    if (this.connectionsLoaded && this.connections.length === 0) {
      this.showConnectionsEditor();
    }

    this.updateTitle();
  }

  @Watch("connectionsLoaded")
  private handleConnectionsLoaded(newValue: boolean) {
    if (newValue && this.connections.length === 0) {
      this.showConnectionsEditor();
    }
  }

  private showConnectionsEditor(): void {
    this.connectionsEditorVisible = true;
  }

  private showSettings(): void {
    this.settingsVisible = true;
  }

  private updateTitle(): void {
    // Update the window title with the file name
    if (this.selectedTab) {
      if (this.selectedTab.fileName) {
        this.api.setRepresentedFilename(this.selectedTab?.fileName);
      } else {
        this.api.setRepresentedFilename(this.selectedTab?.name);
      }
    } else {
      this.api.setRepresentedFilename(null);
    }
  }
}
</script>
<style lang="scss">
#mainnav > .v-navigation-drawer__content {
  overflow: unset;
}

.splitpanes--horizontal .splitpanes__pane {
  transition-duration: 0ms;
}

.splitpanes.dark-theme {
  .splitpanes__pane {
    background-color: #363636;
  }
  .splitpanes__splitter {
    background-color: #363636;
    box-sizing: border-box;
    position: relative;
    flex-shrink: 0;
    &:before,
    &:after {
      content: "";
      position: absolute;
      top: 50%;
      left: 50%;
      background-color: rgba(255, 255, 255, 0.12);
      transition: background-color 0s;
    }
    &:hover:before,
    &:hover:after {
      background-color: rgba(0, 0, 0, 0.25);
    }
    &:first-child {
      cursor: auto;
    }
  }
}
.dark-theme {
  &.splitpanes .splitpanes .splitpanes__splitter {
    z-index: 1;
  }
  &.splitpanes--vertical > .splitpanes__splitter,
  .splitpanes--vertical > .splitpanes__splitter {
    width: 8px;
    border-left: 1px solid rgba(255, 255, 255, 0.12);
    border-right: 1px solid rgba(255, 255, 255, 0.12);
    &:before,
    &:after {
      transform: translateY(-50%);
      width: 1px;
      height: 30px;
    }
    &:before {
      margin-left: -2px;
    }
    &:after {
      margin-left: 1px;
    }
  }
  &.splitpanes--horizontal > .splitpanes__splitter,
  .splitpanes--horizontal > .splitpanes__splitter {
    height: 8px;
    border-top: 1px solid rgba(255, 255, 255, 0.12);
    border-bottom: 1px solid rgba(255, 255, 255, 0.12);
    &:before,
    &:after {
      transform: translateX(-50%);
      width: 30px;
      height: 1px;
    }
    &:before {
      margin-top: -2px;
    }
    &:after {
      margin-top: 1px;
    }
  }
}

.splitpanes.light-theme {
  .splitpanes__pane {
    background-color: #ffffff;
  }
  .splitpanes__splitter {
    background-color: #ffffff;
    box-sizing: border-box;
    position: relative;
    flex-shrink: 0;
    &:before,
    &:after {
      content: "";
      position: absolute;
      top: 50%;
      left: 50%;
      background-color: rgba(255, 255, 255, 0.12);
      transition: background-color 0s;
    }
    &:hover:before,
    &:hover:after {
      background-color: rgba(0, 0, 0, 0.25);
    }
    &:first-child {
      cursor: auto;
    }
  }
}
.light-theme {
  &.splitpanes .splitpanes .splitpanes__splitter {
    z-index: 1;
  }
  &.splitpanes--vertical > .splitpanes__splitter,
  .splitpanes--vertical > .splitpanes__splitter {
    width: 8px;
    border-left: 1px solid rgba(0, 0, 0, 0.12);
    border-right: 1px solid rgba(0, 0, 0, 0.12);
    &:before,
    &:after {
      transform: translateY(-50%);
      width: 1px;
      height: 30px;
    }
    &:before {
      margin-left: -2px;
    }
    &:after {
      margin-left: 1px;
    }
  }
  &.splitpanes--horizontal > .splitpanes__splitter,
  .splitpanes--horizontal > .splitpanes__splitter {
    height: 8px;
    border-top: 1px solid rgba(0, 0, 0, 0.12);
    border-bottom: 1px solid rgba(0, 0, 0, 0.12);
    &:before,
    &:after {
      transform: translateX(-50%);
      width: 30px;
      height: 1px;
    }
    &:before {
      margin-top: -2px;
    }
    &:after {
      margin-top: 1px;
    }
  }
}

.dark-error-box {
  background-color: #1e1e1e;
  color: #f44336 !important;
  caret-color: #f44336 !important;
}

.light-error-box {
  background: #ffffff;
  color: #f44336 !important;
  caret-color: #f44336 !important;
}
</style>
