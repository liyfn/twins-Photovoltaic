<!--
 * @Description: 风电场景的入口文件
 * @Author: caocong “caocong@hopewind.com”
 * @Date: 2024-11-19 14:31:50
 * @LastEditors: caocong “caocong@hopewind.com”
 * @LastEditTime: 2025-05-15 09:14:53
 * @FilePath: \digital_twins2\src\components\three\index.vue
 * Copyright 2024 Shenzhen Hopewind Electric Co., Ltd, All Rights Reserved. 
-->
<template>
  <div id="screen" ref="screenRef"></div>
  <operation :type="type" class="operation" />
</template>

<script lang="ts" setup>
import entry from "./api/entry";
import EventBus from "@/utils/eventBus";
import Operation from "@/components/operation/operation.vue";

const route = useRoute();

const screenRef = ref<HTMLElement>();
const type = ref<"wind" | "photovoltaic" | "tech">("wind");

let clearAll: Function;
onMounted(() => {
  clearAll = entry(screenRef.value as HTMLElement);
  if (route.fullPath.includes("wind")) {
    EventBus.getInstance().emit("windModel");
    type.value = "wind";
  } else if (route.fullPath.includes("solar")) {
    EventBus.getInstance().emit("photovoltaicModel");
    type.value = "photovoltaic";
  } else if (route.fullPath.includes("tech")) {
    EventBus.getInstance().emit("techStyleModel");
    type.value = "tech";
  }
});

// 做成缓存的话，这里就不用加了
onBeforeUnmount(() => {
  clearAll();
});
</script>

<style lang="scss" scoped>
#screen {
  width: 100vw;
  height: 100vh;
}

.operation {
  position: absolute;
  top: 0;
  right: 0;
}
</style>
