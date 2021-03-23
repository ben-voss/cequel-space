<template>
  <v-tabs v-model="selectedIndex">
    <v-tab v-for="tab in tabs" :key="tab.id">
      <EditableLabel v-model="tab.name"></EditableLabel>
      <v-btn
        x-small
        icon
        style="margin-left: 5px"
        @click.stop="closeEditor(tab)"
        ><v-icon>{{ mdiClose }}</v-icon></v-btn
      >
    </v-tab>
  </v-tabs>
</template>

<script lang="ts">
import { Vue, Component } from "vue-property-decorator";
import { State, Action } from "vuex-class";
import { mdiClose } from "@mdi/js";
import EditableLabel from "./EditableLabel.vue";
import Tab from "@/model/Tab";
import CloseEditorCommand from "../commands/CloseEditorCommand";
import { LazyInject, Symbols } from "@/di";
import Api from "@/api/Api";

@Component({
  components: {
    EditableLabel
  }
})
export default class TabBar extends Vue {
  private mdiClose = mdiClose;

  @LazyInject(Symbols.Api)
  private api!: Api;

  @State("tabs", { namespace: "tabs" }) tabs!: Tab[];
  @State("selectedIndex", { namespace: "tabs" })
  _selectedIndex!: number;

  @Action("delete", { namespace: "tabs" })
  deleteTab!: (args: { tab: Tab }) => Promise<Tab>;

  @Action("setSelectedIndex", { namespace: "tabs" })
  setSelectedIndex!: (args: { index: number }) => Promise<void>;

  get selectedIndex(): number {
    return this._selectedIndex;
  }
  set selectedIndex(index: number) {
    this.setSelectedIndex({ index });
  }

  private closeEditor(tab: Tab): Promise<void> {
    return new CloseEditorCommand(tab, this.api, this.$store).action();
  }
}
</script>
