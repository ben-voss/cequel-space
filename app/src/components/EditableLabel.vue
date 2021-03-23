<template>
  <div>
    <v-text-field
      ref="editor"
      v-if="editMode"
      v-model="internalValue"
      @blur="exitEditMode()"
      v-on:keyup.enter="exitEditMode()"
      v-on:keyup.escape="cancelEditMode()"
    ></v-text-field>
    <span v-else @dblclick="enterEditMode()">
      {{ value }}
    </span>
  </div>
</template>

<script lang="ts">
import { Vue, Component, Prop } from "vue-property-decorator";

@Component({
  components: {}
})
export default class EditableLabel extends Vue {
  internalValue = "";
  editMode = false;

  @Prop({
    type: String,
    default: () => {
      return null;
    }
  })
  value!: string;

  enterEditMode(): void {
    this.internalValue = this.value;
    this.editMode = true;

    // Use next tick so that the text editor has been created after the binding has evaluated.
    this.$nextTick(() => {
      const inputElement = this.$refs.editor as any;

      inputElement.focus();
      inputElement.$refs.input.select();
    });
  }

  cancelEditMode(): void {
    this.editMode = false;
  }

  exitEditMode(): void {
    if (this.internalValue === "") {
      return;
    }

    this.$emit("input", this.internalValue);
    this.editMode = false;
  }
}
</script>
