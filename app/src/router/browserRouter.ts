import Vue from "vue";
import VueRouter from "vue-router";
import { vuexOidcCreateRouterMiddleware } from "vuex-oidc";
import BrowserMain from "../views/BrowserMain.vue";
import OidcCallback from "../views/OidcCallback.vue";
import OidcPopupCallback from "../views/OidcPopupCallback.vue";
import OidcCallbackError from "../views/OidcCallbackError.vue";
import OidcSilentRenew from "../views/OidcSilentRenew.vue";
import { Store } from "vuex";
import { inject, injectable } from "inversify";
import { BrowserState } from "@/store/browserStore";
import { Symbols } from "@/di";

Vue.use(VueRouter);

@injectable()
export class BrowserRouter extends VueRouter {
  constructor(@inject(Symbols.Store) store: Store<BrowserState>) {
    super({
      mode: "history",
      base: process.env.BASE_URL,
      routes: [
        {
          path: "/oidc-callback",
          name: "oidcCallback",
          component: OidcCallback
        },
        {
          path: "/oidc-popup-callback",
          name: "oidcPopupCallback",
          component: OidcPopupCallback
        },
        {
          path: "/oidc-callback-error",
          name: "oidcCallbackError",
          component: OidcCallbackError,
          meta: {
            isPublic: true
          }
        },
        {
          path: "/oidc-silent-renew",
          name: "oidcSilentRenew",
          component: OidcSilentRenew
        },

        {
          path: "/",
          name: "Main",
          component: BrowserMain
        }
      ]
    });

    this.beforeEach(vuexOidcCreateRouterMiddleware(store, "oidcStore"));
  }
}
