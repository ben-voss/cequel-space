<template>
  <div @contextmenu="tryContextMenu($event)">
    <v-treeview
      id="tree"
      ref="tree"
      dense
      :items="items"
      activatable
      open-on-click
      :expand-icon="mdiChevronDown"
      class="text-body-2 v-treeview--very-dense"
      style="margin-left: 0px"
      return-object
      :open.sync="treeOpen"
    >
      <template v-slot:label="{ item }">
        <label @contextmenu.stop="contextMenu($event, item)">{{
          item.name
        }}</label>
      </template>
    </v-treeview>
  </div>
</template>

<script lang="ts">
import TreeNode from "@/model/nodes/TreeNode";
import { Vue, Component, Prop, Watch } from "vue-property-decorator";
import { mdiChevronDown, mdiFolder, mdiFolderOpen } from "@mdi/js";

@Component({})
export default class SchemaTree extends Vue {
  private mdiChevronDown = mdiChevronDown;
  private mdiFolder = mdiFolder;
  private mdiFolderOpen = mdiFolderOpen;

  private treeOpen: [] = [];

  @Prop({
    type: Array as () => TreeNode[],
    default: () => []
  })
  items!: TreeNode[];

  @Watch("treeOpen")
  private handleTreeOpenChange(newValue: TreeNode[]) {
    for (let i = newValue.length - 1; i >= 0; i--) {
      if (newValue[i].shouldLoadChildren) {
        newValue[i].loadChildren();
      }
    }
  }

  // Take a context menu event from anywhere on the tree and re-fire it on the label for the entry clicked on.
  private tryContextMenu(e: MouseEvent) {
    let i = 0;
    let element = e.target as HTMLDivElement;
    while (
      i < 4 &&
      element.nodeName === "DIV" &&
      !element.matches(".v-treeview-node__root")
    ) {
      element = element.parentElement as HTMLDivElement;
      i++;
    }

    if (element !== null && element.matches(".v-treeview-node__root")) {
      const contentNode = this.getChildNode(
        ".v-treeview-node__content",
        element
      );
      if (contentNode !== null) {
        const labelNode = this.getChildNode(
          ".v-treeview-node__label",
          contentNode
        );

        if (labelNode !== null) {
          e.stopPropagation();
          e.preventDefault();

          (labelNode.firstElementChild as HTMLDivElement).dispatchEvent(
            new MouseEvent("contextmenu", {
              clientX: e.clientX,
              clientY: e.clientY,
              bubbles: false
            })
          );
        }
      }
    }
  }

  private getChildNode(className: string, element: Element): Element | null {
    let child = element.firstElementChild;
    while (child !== null) {
      if (child.matches(className)) {
        return child;
      }

      child = child.nextElementSibling;
    }

    return null;
  }

  contextMenu(e: MouseEvent, item: TreeNode) {
    this.$emit("contextMenu", e, item);
  }
}
</script>
<style lang="scss">
.v-treeview--very-dense .v-treeview-node__root {
  min-height: 24px !important;
}
.v-treeview-node__level {
  width: 20px !important;
}
.v-treeview-node__content {
  margin-left: 3px !important;
}
</style>
