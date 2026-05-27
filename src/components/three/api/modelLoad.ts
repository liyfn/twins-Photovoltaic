/*
 * @Description: 模型解压和模型导入
 * @Author: caocong “caocong@hopewind.com”
 * @Date: 2024-11-28 19:38:24
 * @LastEditors: caocong “caocong@hopewind.com”
 * @LastEditTime: 2025-01-13 15:48:12
 * @FilePath: \three-wind\src\components\three\api\modelLoad.ts
 * Copyright 2025 Shenzhen Hopewind Electric Co., Ltd, All Rights Reserved. 
 */
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";

const base = import.meta.env.BASE_URL;

const draco = new DRACOLoader();
draco.setDecoderPath(`${base}draco/`); // 根据pubic里面解压文件结构设置

export default function modelLoader(
  url: string,
  callback: (...args: any) => void
) {
  if (url.endsWith(".glb") || url.endsWith(".gltf")) {
    const loader = new GLTFLoader();
    loader.setDRACOLoader(draco);
    // 自动拼接 base 路径（兼容 GitHub Pages 等非根路径部署）
    const fullUrl = url.startsWith("http") ? url : `${base}${url.replace(/^\//, "")}`;
    loader.load(fullUrl, (glb) => {
      callback(glb);
    });
    return loader;
  }
}
