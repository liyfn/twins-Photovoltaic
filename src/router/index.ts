/*
 * @Description: 
 * @Author: caocong “caocong@hopewind.com”
 * @Date: 2024-11-28 16:31:32
 * @LastEditors: caocong “caocong@hopewind.com”
 * @LastEditTime: 2025-01-06 13:49:45
 * @FilePath: \three-wind\src\router\index.ts
 * Copyright 2024 Shenzhen Hopewind Electric Co., Ltd, All Rights Reserved. 
 */
import { createRouter, createWebHashHistory } from "vue-router";

const routes = [
  {
    path: "/",
    redirect: "/solarScreen",
  },
  {
    path: "/windScreen",
    name: "风电大屏",
    component: () => import("@/views/index.vue"),
  },
  {
    path: "/solarScreen",
    name: "光伏大屏",
    component: () => import("@/views/index.vue"),
  },
  {
    path: "/techScreen",
    name: "科技大屏",
    component: () => import("@/views/index.vue"),
  },
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

export default router;
