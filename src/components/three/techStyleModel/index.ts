/*
 * @Description: 科技风的孪生场景
 * @Author: caocong “caocong@hopewind.com”
 * @Date: 2024-12-31 09:06:47
 * @LastEditors: caocong “caocong@hopewind.com”
 * @LastEditTime: 2025-02-28 14:09:47
 * @FilePath: \digital_twins2\src\components\three\techStyleModel\index.ts
 * Copyright 2024 Shenzhen Hopewind Electric Co., Ltd, All Rights Reserved.
 */
import Light from "../api/light";
import Renderer from "../api/renderer";
import TechPhotovoltaic from "./techPhotovoltaic";

export default class TechStyleModel {
  status = [
    {
      status: 1,
    },
    {
      status: 0,
    },
    {
      status: 2,
    },
    {
      status: 0,
    },
    {
      status: 2,
    },
    {
      status: 0,
    },
    {
      status: 1,
    },
    {
      status: 0,
    },
  ];
  constructor() {
    this.init();
  }
  init() {
    // 更改灯光，科技风不需要太阳光，至于要环境光即可，最多加个射灯，不需要阴影
    Light.getInstance().clearAll();
    Light.getInstance().addLight("AmbientLight", "科技环境光", 3, 0xffffff);
    Light.getInstance().light[0].layers.enableAll();
    Renderer.getInstance().renderer.autoClear = false;
    // 初始化主要的场景，风电就是风机，光伏就是方阵(方阵的模型需要重新搞)
    new TechPhotovoltaic(this.status);
  }
}
