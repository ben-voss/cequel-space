import { Module } from "vuex";
import { VuexOidcClientSettings, vuexOidcCreateStoreModule, VuexOidcErrorPayload, VuexOidcState } from "vuex-oidc";
import AppState from "../AppState";

export default function oidcStateFactory(settings: VuexOidcClientSettings): Module<VuexOidcState, AppState> {
  return vuexOidcCreateStoreModule(
    settings,
    {
      namespaced: true,
      dispatchEventsOnWindow: true
    },
    {
      userLoaded: () => {
        console.log("OIDC user loaded.");
      },
      userUnloaded: () => {
        console.log("OIDC user unloaded");
      },
      accessTokenExpiring: () => {
        console.log("OIDC access token expiring");
      },
      accessTokenExpired: () => {
        console.log("OIDC access token expired");
      },
      silentRenewError: () => {
        console.log("OIDC slent renew error");
      },
      userSignedOut: () => {
        console.log("OIDC user signed out");
      },
      oidcError: ((payload: VuexOidcErrorPayload | undefined) => {
        console.log("OIDC error " + payload?.error);
      }) as () => {}
    }
  );
}