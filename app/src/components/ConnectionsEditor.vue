<template>
  <v-dialog v-model="value" width="700px" persistent>
    <v-card v-if="value" class="mx-auto">
      <v-toolbar dense>
        <v-toolbar-title>Manage Connections</v-toolbar-title>
        <v-spacer></v-spacer>
        <v-btn icon @click.stop="onClose">
          <v-icon>
            {{ mdiClose }}
          </v-icon>
        </v-btn>
      </v-toolbar>
      <v-container style="padding: 0px">
        <v-row no-gutters>
          <v-col cols="4">
            <v-navigation-drawer permanent width="250">
              <div class="pa-2">
                <v-btn block @click.stop="onAdd">
                  Add
                </v-btn>
              </div>
              <v-divider></v-divider>
              <v-list dense>
                <v-list-item-group v-model="selectedConnectionIndex">
                  <v-list-item
                    v-for="connection in connections"
                    :key="connection.id"
                    link
                  >
                    <v-list-item-title
                      v-text="connection.name"
                    ></v-list-item-title>
                  </v-list-item>
                </v-list-item-group>
              </v-list>
            </v-navigation-drawer>
          </v-col>
          <v-col cols="8">
            <v-expand-transition>
              <ValidationObserver
                v-if="selectedConnection"
                ref="observer"
                v-slot="{ handleSubmit, invalid }"
              >
                <v-form
                  @submit.prevent="
                    handleSubmit(() => {
                      onSave();
                    })
                  "
                >
                  <v-container>
                    <v-row>
                      <v-col cols="12">
                        <ValidationProvider
                          v-slot="{ errors }"
                          name="Name"
                          rules="required|max:20"
                          mode="aggressive"
                        >
                          <v-text-field
                            v-model="selectedConnection.name"
                            label="Name"
                            :error-messages="errors"
                            required
                          ></v-text-field>
                        </ValidationProvider>
                      </v-col>
                    </v-row>
                    <v-row>
                      <v-col cols="12">
                        <ValidationProvider
                          v-slot="{ errors }"
                          name="Host"
                          rules="required|max:253"
                          mode="aggressive"
                        >
                          <v-text-field
                            v-model="selectedConnection.hostName"
                            label="Host"
                            :error-messages="errors"
                            required
                          ></v-text-field>
                        </ValidationProvider>
                      </v-col>
                    </v-row>
                    <v-row>
                      <v-col cols="12">
                        <ValidationProvider
                          v-slot="{ errors }"
                          name="Port"
                          rules="max_value:65535|min_value:1"
                          mode="aggressive"
                        >
                          <v-text-field
                            min="1"
                            max="65535"
                            step="1"
                            :value="selectedConnection.port"
                            @change="
                              selectedConnection.port = parsePort($event)
                            "
                            label="Port"
                            type="number"
                            number
                            :error-messages="errors"
                          ></v-text-field>
                        </ValidationProvider>
                      </v-col>
                    </v-row>
                    <v-row>
                      <v-col cols="12">
                        <ValidationProvider
                          v-slot="{ errors }"
                          name="Database"
                          rules="required|max:128"
                          mode="aggressive"
                        >
                          <v-text-field
                            v-model="selectedConnection.database"
                            label="Database"
                            :error-messages="errors"
                            required
                          ></v-text-field>
                        </ValidationProvider>
                      </v-col>
                    </v-row>
                    <v-row>
                      <v-col cols="12">
                        <ValidationProvider
                          v-slot="{ errors }"
                          name="Username"
                          rules="required|max:128"
                          mode="aggressive"
                        >
                          <v-text-field
                            v-model="selectedConnection.username"
                            label="Username"
                            :error-messages="errors"
                            required
                          ></v-text-field>
                        </ValidationProvider>
                      </v-col>
                    </v-row>
                    <v-row>
                      <v-col cols="12">
                        <ValidationProvider
                          v-slot="{ errors }"
                          name="Password"
                          rules="required|max:128"
                          mode="aggressive"
                        >
                          <v-text-field
                            v-model="selectedConnection.password"
                            label="Password"
                            type="password"
                            :error-messages="errors"
                            required
                          ></v-text-field>
                        </ValidationProvider>
                      </v-col>
                    </v-row>
                    <v-row>
                      <v-col cols="4">
                        <v-btn
                          color="green darken-1"
                          @click.stop="onTest"
                          :disabled="invalid"
                          >{{ testId ? "Stop" : "Test" }}</v-btn
                        >
                      </v-col>
                      <v-col cols="8" class="text-right">
                        <v-dialog v-model="confirmDelete" width="400">
                          <template v-slot:activator="{ on, attrs }">
                            <v-btn
                              :disabled="selectedConnection.id === undefined"
                              color="red darken-1"
                              v-bind="attrs"
                              v-on="on"
                            >
                              Delete</v-btn
                            >
                          </template>
                          <v-card>
                            <v-card-title class="headline lighten-1">
                              Confirm Delete
                            </v-card-title>

                            <v-card-text>
                              Are you sure you want to delete '{{
                                selectedConnection.name
                              }}'?
                            </v-card-text>

                            <v-divider></v-divider>

                            <v-card-actions>
                              <v-spacer></v-spacer>
                              <v-btn
                                color="red darken-1"
                                @click.stop="
                                  onDelete();
                                  confirmDelete = false;
                                "
                              >
                                Yes
                              </v-btn>
                              <v-btn
                                color="green darken-1"
                                @click.stop="confirmDelete = false"
                              >
                                No
                              </v-btn>
                            </v-card-actions>
                          </v-card>
                        </v-dialog>
                        &nbsp;
                        <v-btn
                          color="primary darken-1"
                          type="submit"
                          :disabled="invalid"
                          >Save</v-btn
                        >
                      </v-col>
                    </v-row>
                  </v-container>
                </v-form>
              </ValidationObserver>
            </v-expand-transition>
            <v-expand-transition>
              <v-container
                v-if="!selectedConnection"
                fill-height
                fluid
                style="height: 400px"
              >
                <v-row align="center" justify="center">
                  <v-col cols="8" class="text-center">
                    <v-btn color="green darken-1" @click.stop="onAdd">
                      Add Connection
                    </v-btn>
                  </v-col>
                </v-row>
              </v-container>
            </v-expand-transition>
          </v-col>
        </v-row>
      </v-container>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import { Vue, Component, Watch, Prop } from "vue-property-decorator";
import { Action, State } from "vuex-class";
import Connection from "../model/Connection";
import { mdiClose } from "@mdi/js";
import {
  extend,
  setInteractionMode,
  ValidationProvider,
  ValidationObserver
} from "vee-validate";
import { required, max } from "vee-validate/dist/rules";
import { LazyInject, Symbols } from "@/di";
import Api from "@/api/Api";
import RpcClient from "@/rpc/RpcClient";

@Component({
  components: {
    ValidationProvider,
    ValidationObserver
  }
})
export default class ConnectionsEditor extends Vue {
  private mdiClose = mdiClose;

  @LazyInject(Symbols.Api)
  private api!: Api;

  @LazyInject(Symbols.RpcClient)
  private rpcClient!: RpcClient;

  @State("connections", { namespace: "connections" })
  private connections!: Connection[];

  @Action("add", { namespace: "connections" })
  add!: (args: { connection: Connection }) => Promise<Connection>;

  @Action("update", { namespace: "connections" })
  update!: (args: { connection: Connection }) => Promise<void>;

  @Action("delete", { namespace: "connections" })
  delete!: (args: { connection: Connection }) => Promise<void>;

  @Prop({
    type: Boolean,
    default: false
  })
  value!: boolean;

  private selectedConnectionIndex = -1;
  private selectedConnection: Connection | null = null;
  private testId: string | null = null;
  private confirmDelete = false;

  mounted(): void {
    setInteractionMode("eager");

    extend("required", {
      ...required,
      message: "{_field_} cannot be empty."
    });

    extend("max", {
      ...max,
      message: "{_field_} cannot be longer than {length} characters."
    });

    extend("max_value", {
      validate: (value, params: any) => {
        if (value === null) {
          return true;
        }

        return value <= Number(params.max);
      },
      params: ["max"],
      message: "{_field_} cannot be larger than {max}."
    });

    extend("min_value", {
      validate: (value, params: any) => {
        if (value === null) {
          return true;
        }

        return value >= Number(params.min);
      },
      params: ["min"],
      message: "{_field_} cannot be less than {min}."
    });
  }

  parsePort(value: string): number | null {
    if (value === "" || value === undefined || value === null) {
      return null;
    }

    const parsed = parseInt(value, 10);
    if (isNaN(parsed)) {
      return null;
    }

    return parsed;
  }

  onClose(): void {
    this.$emit("input", false);
  }

  @Watch("connections")
  handleConnectionsChnage(): void {
    if (this.connections.length === 0) {
      this.selectedConnectionIndex = -1;
    } else if (this.selectedConnectionIndex >= this.connections.length) {
      this.selectedConnectionIndex = this.connections.length - 1;
    } else if (this.selectedConnectionIndex < 0) {
      this.selectedConnectionIndex = 0;
    }
  }

  @Watch("selectedConnectionIndex")
  handleSelectedConnectionIndexChange(): void {
    if (
      this.selectedConnectionIndex >= 0 &&
      this.selectedConnectionIndex < this.connections.length
    ) {
      this.selectedConnection = this.connections[this.selectedConnectionIndex];
    } else if (this.selectedConnection?.id) {
      this.selectedConnection = null;
    }
  }

  onAdd(): void {
    this.selectedConnectionIndex = -1;
    this.selectedConnection = {
      id: undefined,
      name: "New Connection",
      hostName: "",
      username: "",
      password: "",
      port: null,
      database: ""
    };

    // Resetting the validation observer prevents a initial set of validation messages from being displayed.
    (this.$refs.observer as any).reset();
  }

  async onSave(): Promise<void> {
    const connection = this.selectedConnection;

    if (!connection) {
      return;
    }

    if (connection.id) {
      this.update({ connection });
    } else {
      const newConnection = await this.add({ connection });
      this.selectedConnectionIndex = this.connections.indexOf(newConnection);
    }
  }

  async onDelete(): Promise<void> {
    const connection = this.selectedConnection;

    if (!connection) {
      return;
    }

    if (connection.id) {
      await this.delete({ connection });
    }
  }

  private async onTest(): Promise<void> {
    if (this.testId) {
      this.api.cancelConnectionTest(this.testId);
      this.testId = null;
    } else {
      if (!this.selectedConnection) {
        return;
      }

      this.testId = await this.api.startConnectionTest(this.selectedConnection);

      const result = await this.api.getConnectionTest(this.testId);
      this.testId = null;

      if (result.result) {
        this.rpcClient.call("dialog", {
          type: "info",
          buttons: ["OK"],
          message: "Connection successful."
        });
      } else {
        this.rpcClient.call("dialog", {
          type: "error",
          buttons: ["OK"],
          message: "Connection failed.",
          detail: result.message
        });
      }
    }
  }
}
</script>
