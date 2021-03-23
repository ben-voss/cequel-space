import { injectable } from "inversify";
import Vue from "vue";
import VueRouter from "vue-router";
import ElectronMain from "../views/ElectronMain.vue";

Vue.use(VueRouter);

@injectable()
export class ElectronRouter extends VueRouter {
  constructor() {
    super({
      mode: "history",
      base: process.env.BASE_URL,
      routes: [
        {
          path: "*",
          name: "Main",
          component: ElectronMain
        }
      ]
    });
  }
}
