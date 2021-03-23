<template>
  <v-navigation-drawer
    :value="isVisible"
    v-on:input="setVisibility($event)"
    app
    temporary
    right
    hide-overlay
    width="270px"
  >
    <v-toolbar dense>
      Settings
      <v-spacer></v-spacer>
      <v-btn class="mx-2" icon @click.stop="setVisibility(false)">
        <v-icon>
          {{ mdiClose }}
        </v-icon>
      </v-btn>
    </v-toolbar>

    <v-list-item>
      <v-list-item-content>
        <v-row align="center" justify="space-around">
          <v-btn
            :color="!$vuetify.theme.dark ? 'primary' : 'normal'"
            class="mx-2"
            @click.stop="setDarkMode(false)"
          >
            Light
            <v-icon>
              {{ mdiWhiteBalanceSunny }}
            </v-icon>
          </v-btn>
          <v-btn
            :color="$vuetify.theme.dark ? 'primary' : 'normal'"
            class="mx-2"
            @click.stop="setDarkMode(true)"
          >
            Dark
            <v-icon>
              {{ mdiWeatherNight }}
            </v-icon>
          </v-btn>
        </v-row>
      </v-list-item-content>
    </v-list-item>
  </v-navigation-drawer>
</template>

<script lang="ts">
import { Vue, Component, Prop, Watch } from "vue-property-decorator";
import { mdiClose, mdiWhiteBalanceSunny, mdiWeatherNight } from "@mdi/js";

@Component({})
export default class SettingsNav extends Vue {
  private mdiWhiteBalanceSunny = mdiWhiteBalanceSunny;
  private mdiWeatherNight = mdiWeatherNight;
  private mdiClose = mdiClose;

  private isVisible = false;

  @Prop({
    type: Boolean,
    default: false
  })
  value!: boolean;

  @Watch("value")
  private setVisibility(newValue: boolean): void {
    this.isVisible = newValue;
    this.$emit("input", newValue);
  }

  private setDarkMode(isDarkMode: boolean): void {
    this.$vuetify.theme.dark = isDarkMode;
    this.$cookies.set("isDarkMode", isDarkMode);
  }
}
</script>
