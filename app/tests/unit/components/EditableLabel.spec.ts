import EditableLabel from "@/components/EditableLabel.vue";
import { mount } from "@vue/test-utils";

import Vue from "vue";
import Vuetify from "vuetify";
Vue.use(Vuetify)

function unwrap(foo: any[][] | undefined): any {
  if (foo && foo.length > 0) {
    foo = foo[0];
  }
  if (foo && foo.length > 0) {
    foo = foo[0];
  }

  return foo;
}

describe("EditableLabel", () => {
  test("If not in edit mode then the label is shown and the editable field is hidden", async () => {
    const wrapper = mount(EditableLabel);
    wrapper.setData({ editMode: false });

    await wrapper.vm.$nextTick();
    expect(wrapper.find(".v-text-field").exists()).toBe(false);
    expect(wrapper.find("span").exists()).toBe(true);
  });

  test("If in edit mode then editable field is shown and the label is hidden", async () => {
    const wrapper = mount(EditableLabel);
    wrapper.setData({ editMode: true });

    await wrapper.vm.$nextTick();
    expect(wrapper.find(".v-text-field").exists()).toBe(true);
    expect(wrapper.find("span").exists()).toBe(false);
  });

  test("Should switch to edit mode when double clicked", async () => {
    const wrapper = mount(EditableLabel);
    wrapper.setData({ editMode: false });
    const label = wrapper.find("span");
    label.trigger("dblclick");

    await wrapper.vm.$nextTick();
    expect(wrapper.find(".v-text-field").exists()).toBe(true);
    expect(wrapper.find("span").exists()).toBe(false);
  });

  test("Exit edit mode when enter pressed", async () => {
    const wrapper = mount(EditableLabel);
    wrapper.setData({ editMode: true });
    await wrapper.vm.$nextTick();

    const textField = wrapper.find(".v-text-field");
    const input = textField.find("input");
    input.trigger("keyup.enter");

    await wrapper.vm.$nextTick();
    expect(wrapper.find(".v-text-field").exists()).toBe(false);
    expect(wrapper.find("span").exists()).toBe(true);
  });

  test("Exit edit mode when escape pressed", async () => {
    const wrapper = mount(EditableLabel);
    wrapper.setData({ editMode: true });
    await wrapper.vm.$nextTick();

    const textField = wrapper.find(".v-text-field");
    const input = textField.find("input");
    input.trigger("keyup.escape");

    await wrapper.vm.$nextTick();
    expect(wrapper.find(".v-text-field").exists()).toBe(false);
    expect(wrapper.find("span").exists()).toBe(true);
  });
/*
  test("Input event raised when when enter pressed", async () => {
    const wrapper = mount(EditableLabel);
    wrapper.setData({ editMode: true });
    await wrapper.vm.$nextTick();

    const textField = wrapper.find(".v-text-field");
    const input = textField.find("input");
    (input.element as HTMLInputElement).value = "Message 2";

//    input.setValue("Message 2");

    input.trigger("keyup.enter");
    expect(unwrap(textField.emitted()["input"])).toBe("Message 2");
  });*/

  test("Input event NOT raised when when escape pressed", async () => {
    const wrapper = mount(EditableLabel);
    wrapper.setData({ editMode: true });
    await wrapper.vm.$nextTick();

    const textField = wrapper.find(".v-text-field");
    const input = textField.find("input");
    (input.element as HTMLInputElement).value = "Message 2";
//    input.setValue("Message 2");

    input.trigger("keyup.escape");
    expect(unwrap(textField.emitted()["input"])).toBeFalsy();
  });
});
