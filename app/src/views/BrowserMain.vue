<template>
  <Main v-if="oidcIsAuthenticated">
    <template v-slot:userInfo>
      <UserInfo></UserInfo>
    </template>
  </Main>
</template>

<script lang="ts">
import { Vue, Component } from "vue-property-decorator";
import { Getter } from "vuex-class";
import Main from "./Main.vue";
import UserInfo from "../components/UserInfo.vue";
import { LazyInject, Symbols } from "@/di";
import Tab from "@/model/Tab";

@Component({
  components: {
    Main,
    UserInfo
  }
})
export default class BrowserMain extends Vue {
  @Getter("oidcIsAuthenticated", { namespace: "oidcStore" })
  oidcIsAuthenticated!: boolean;

  @LazyInject(Symbols.TabFactory)
  private tabFactory!: () => Tab;

  async beforeMount(): Promise<void> {
    this.$store.dispatch("tabs/add", { tab: this.tabFactory() });
  }
}
</script>
