<template>
  <v-navigation-drawer app permanent clipped id="mainnav">
    <v-list-item>
      <v-list-item-content>
        <v-select
          :items="connections"
          v-model="selectedConnection"
          item-value="id"
          item-text="name"
          solo
          dense
          flat
          hide-details
          return-object
        >
        </v-select>
      </v-list-item-content>
    </v-list-item>

    <v-divider></v-divider>

    <v-list dense nav style="height: 100%">
      <div style="height: 100%; overflow-x: auto; overflow-y: auto">
        <v-list-group v-for="category in items" :key="category.name">
          <template v-slot:activator>
            <v-list-item-icon style="margin-right: 6px">
              <v-icon>{{ category.icon }}</v-icon>
            </v-list-item-icon>
            <v-list-item-title class="text-subtitle-1">{{
              category.name
            }}</v-list-item-title>
          </template>
          <template v-slot:appendIcon>
            <v-icon>{{ mdiChevronDown }}</v-icon>
          </template>

          <SchemaTree
            :items="treeItemsForCategory(category)"
            @contextMenu="(event, item) => show(event, category.name, item)"
          >
          </SchemaTree>
        </v-list-group>
      </div>
    </v-list>

    <v-menu
      v-model="showMenu"
      :position-x="x"
      :position-y="y"
      absolute
      offset-y
    >
      <v-list>
        <template v-for="menuItem in menuItems">
          <v-divider
            v-if="menuItem.name === '-'"
            :key="menuItem.id"
          ></v-divider>
          <v-list-item
            v-else
            @click="menuItem.action(menuItem)"
            :key="menuItem.name"
          >
            <v-list-item-title>{{ menuItem.name }}</v-list-item-title>
          </v-list-item>
        </template>
      </v-list>
    </v-menu>
  </v-navigation-drawer>
</template>

<script lang="ts">
import Connection from "@/model/Connection";
import { Vue, Component } from "vue-property-decorator";
import { State, Action } from "vuex-class";
import SchemaTree from "../components/SchemaTree.vue";
import { mdiCodeParentheses, mdiTableLarge, mdiGlasses, mdiRun } from "@mdi/js";
import TreeNode from "@/model/nodes/TreeNode";
import { mdiChevronDown } from "@mdi/js";
import MenuItem from "@/model/nodes/MenuItem";

@Component({
  components: {
    SchemaTree
  }
})
export default class SchemaNav extends Vue {
  private mdiChevronDown = mdiChevronDown;

  private items = [
    {
      name: "Procedures",
      icon: mdiCodeParentheses,
      children: []
    },
    {
      name: "Tables",
      icon: mdiTableLarge,
      children: []
    },
    {
      name: "Views",
      icon: mdiGlasses,
      children: []
    },
    {
      name: "Triggers",
      icon: mdiRun,
      children: []
    }
  ];

  private x = 0;
  private y = 0;
  private showMenu = false;
  private menuItems: MenuItem[] = [];

  @State("procedures", { namespace: "schema" }) procedures!: TreeNode[];
  @State("views", { namespace: "schema" }) views!: TreeNode[];
  @State("tables", { namespace: "schema" }) tables!: TreeNode[];
  @State("triggers", { namespace: "schema" }) triggers!: TreeNode[];

  @State("connections", { namespace: "connections" })
  connections!: Connection[];

  @State("selectedIndex", { namespace: "connections" })
  selectedIndex!: number;

  @Action("setSelectedIndex", { namespace: "connections" })
  setSelectedIndex!: (args: { index: number }) => void;

  private get selectedConnection(): Connection {
    return this.$store.getters["connections/selected"];
  }

  private set selectedConnection(connection: Connection) {
    const index = this.connections.findIndex(c => c.id === connection.id);

    console.assert(index !== -1);

    this.setSelectedIndex({ index });
  }

  private treeItemsForCategory(x: TreeNode): TreeNode[] {
    switch (x.name) {
      case "Procedures":
        return this.procedures;

      case "Tables":
        return this.tables;

      case "Views":
        return this.views;

      case "Triggers":
        return this.triggers;
    }

    return [];
  }

  private show(e: MouseEvent, category: string, item: TreeNode): void {
    if (!item.menu) {
      return;
    }

    e.preventDefault();
    this.menuItems = item.menu;
    this.showMenu = false;
    this.x = e.clientX;
    this.y = e.clientY;
    this.$nextTick(() => {
      this.showMenu = true;
    });
  }
}
</script>
