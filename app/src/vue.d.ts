declare module "vue/types/vue" {
  interface Vue {
    $store: Vuex.Store<RootState>;
  }
}
