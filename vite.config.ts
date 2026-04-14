/*
 * @Description:
 * @Author: caocong “caocong@hopewind.com”
 * @Date: 2024-11-19 14:22:52
 * @LastEditors: caocong “caocong@hopewind.com”
 * @LastEditTime: 2024-11-29 11:01:51
 * @FilePath: \three-wind\vite.config.ts
 * Copyright 2024 Shenzhen Hopewind Electric Co., Ltd, All Rights Reserved.
 */
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { join } from "path";
import AutoImport from "unplugin-auto-import/vite";
import Components from "unplugin-vue-components/vite";
import { ElementPlusResolver } from "unplugin-vue-components/resolvers";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    AutoImport({
      imports: ["vue", "vue-router", "pinia"],
      dts: true,
      eslintrc: {
        enabled: true,
        filepath: "./.eslintrc-auto-import.json",
        globalsPropValue: true,
      },
      resolvers: [ElementPlusResolver({ importStyle: "sass" })],
    }),
    Components({
      resolvers: [ElementPlusResolver()],
    }),
  ],
  server: {
    host: "0.0.0.0",
    port: 5179,
  },
  resolve: {
    alias: {
      "@": join(__dirname, "src"),
    },
  },
  // 设置scss的api类型为modern-compiler
  css: {
    preprocessorOptions: {
      scss: {
        api: "modern-compiler",
      },
    },
  },
});
