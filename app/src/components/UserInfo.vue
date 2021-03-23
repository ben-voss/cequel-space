<template>
  <v-menu bottom min-width="200px" rounded offset-y v-if="oidcUser">
    <template v-slot:activator="{ on }">
      <v-btn icon v-on="on" width="36" height="36" style="margin-right:-9px">
        <v-avatar color="blue" size="36">
          <img
            v-if="oidcUser.picture"
            :src="oidcUser.picture"
            :alt="oidcUser.name"
          />
          <span v-else class="white--text headline">{{
            oidcUserInitials
          }}</span>
        </v-avatar>
      </v-btn>
    </template>
    <v-card>
      <v-list-item-content class="justify-center">
        <div class="mx-auto text-center">
          <v-avatar color="blue">
            <img
              v-if="oidcUser.picture"
              :src="oidcUser.picture"
              :alt="oidcUser.name"
            />
            <span v-else class="white--text headline">{{
              oidcUserInitials
            }}</span>
          </v-avatar>
          <h3 class="my-3" v-if="oidcUser.name">{{ oidcUser.name }}</h3>
          <p v-if="oidcUser.email" class="caption mt-1">
            {{ oidcUser.email }}
          </p>
          <v-divider class="my-3"></v-divider>
          <v-btn depressed rounded text @click="signOut">
            Logout
          </v-btn>
        </div>
      </v-list-item-content>
    </v-card>
  </v-menu>
</template>

<script lang="ts">
import { ProfileStandardClaims, User } from "oidc-client";
import { Vue, Component } from "vue-property-decorator";
import { Action, Getter } from "vuex-class";

@Component({})
export default class UserInfo extends Vue {
  @Getter("oidcUser", { namespace: "oidcStore" })
  oidcUser!: User & ProfileStandardClaims;

  @Action("signOutOidc", { namespace: "oidcStore" })
  signOut!: () => void;

  get oidcUserInitials(): string | null {
    const first = this.oidcUser.given_name;
    const second = this.oidcUser.family_name;

    if (first && second) {
      return first[0] + second[0];
    } else {
      return null;
    }
  }
}
</script>
