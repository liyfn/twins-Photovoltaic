<!--
 * @Description: 数字孪生，含风电、光伏
 * @Author: caocong “caocong@hopewind.com”
 * @Date: 2024-11-19 14:22:52
 * @LastEditors: caocong “caocong@hopewind.com”
 * @LastEditTime: 2024-11-19 17:10:03
 * @FilePath: \vite-three-rebuild\src\App.vue
 * Copyright 2024 Shenzhen Hopewind Electric Co., Ltd, All Rights Reserved. 
-->
<template>
  <router-view v-slot="{ Component }">
    <keep-alive>
      <component :is="Component" />
    </keep-alive>
  </router-view>
</template>

<script setup lang="ts"></script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  text-decoration: none;
}
html,
body {
  overflow: hidden;
}
</style>
