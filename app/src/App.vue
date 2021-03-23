<template>
  <v-app>
    <v-main app>
      <router-view></router-view>
    </v-main>
  </v-app>
</template>

<script lang="ts">
import { Vue, Component } from "vue-property-decorator";

@Component({})
export default class App extends Vue {}
</script>

<style lang="scss">
@import "../node_modules/@ag-grid-community/core/dist/styles/ag-grid.css";
@import "../node_modules/@ag-grid-community/core/dist/styles/ag-theme-alpine/sass/ag-theme-alpine-mixin";
@import "../node_modules/@ag-grid-community/core/dist/styles/ag-theme-alpine-dark/sass/ag-theme-alpine-dark-mixin";

.ag-theme-alpine {
  @include ag-theme-alpine(
    (
      grid-size: 3px
    )
  );

  .ag-root-wrapper {
    border: 0px;
  }
}

.ag-theme-alpine-dark {
  @include ag-theme-alpine-dark(
    (
      grid-size: 3px
    )
  );

  .ag-root-wrapper {
    border: 0px;
  }
}

// Scroll bar styles
::-webkit-scrollbar {
  width: 7px;
  height: 7px;
}
::-webkit-scrollbar-button {
  width: 7px;
  height: 7px;
}
::-webkit-scrollbar-corner {
  background: transparent;
}
::-webkit-scrollbar-thumb {
  background: #888888;
  border: 0px solid transparent;
  border-radius: 50px;
}
::-webkit-scrollbar-track {
  background: #333333;
  border: 0px none #ffffff;
  border-radius: 53px;
}

// Prevent scroll bounce
.app {
  overflow-y: hidden;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

// Fix autocomplete white backgounds.
// https://stackoverflow.com/questions/62796362/vuetify-v-text-field-background-color-changes-after-giving-a-value
input:-webkit-autofill,
input:-webkit-autofill:hover,
input:-webkit-autofill:focus,
input:-webkit-autofill:active,
textarea:-webkit-autofill,
textarea:-webkit-autofill:hover,
textarea:-webkit-autofill:focus,
textarea:-webkit-autofill:active,
select:-webkit-autofill,
select:-webkit-autofill:hover,
select:-webkit-autofill:focus,
select:-webkit-autofill:active {
  -webkit-background-clip: text;
}
</style>
