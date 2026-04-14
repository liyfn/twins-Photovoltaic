/*
 * @Description: 天空类
 * @Author: caocong “caocong@hopewind.com”
 * @Date: 2024-11-28 13:48:45
 * @LastEditors: caocong “caocong@hopewind.com”
 * @LastEditTime: 2025-02-28 14:26:08
 * @FilePath: \digital_twins2\src\components\three\api\Sky.ts
 * Copyright 2024 Shenzhen Hopewind Electric Co., Ltd, All Rights Reserved.
 */
import { Sky } from "three/addons/objects/Sky.js";
import * as Three from "three";
import Scene from "./scene";
import EventBus from "@/utils/eventBus";

export default class Seasky {
  private static _instance: Seasky | undefined = undefined;
  sky: Sky = new Sky();
  sunPos: Three.Vector3 = new Three.Vector3();

  constructor() {
    this.sky.scale.setScalar(100000); // 放大倍数
    this.init();
    this.addEvent();
    Scene.getInstance().addMesh(this.sky);
    this.sky?.layers.enableAll();
  }

  static getInstance() {
    if (!this._instance) this._instance = new Seasky();
    return this._instance;
  }

  init() {
    this.sky.material.uniforms["mieCoefficient"].value = 0.01; // 太阳对比度，清晰度
    this.sky.material.uniforms["mieDirectionalG"].value = 0.7;
    // 默认是早上的太阳
    this.changeSunState(0.4, 0.6, 85, 90);
  }
  // 更改太阳的位置和状态
  changeSunState(
    turbidity: number,
    rayleigh: number,
    phi: number,
    theta: number
  ) {
    this.sunPos.setFromSphericalCoords(
      1,
      Three.MathUtils.degToRad(phi),
      Three.MathUtils.degToRad(theta)
    );
    this.sky.material.uniforms["sunPosition"].value.copy(this.sunPos); // 太阳的位置和颜色设置
    this.sky.material.uniforms["turbidity"].value = turbidity; // 浑浊度
    this.sky.material.uniforms["rayleigh"].value = rayleigh; // 锐利值
  }
  // TODO：将太阳光位置与天空中太阳进行绑定
  // 点击事件监听
  addEvent() {
    // 时间系统变化位置
    EventBus.getInstance().on("clickTimeSys", (key: string) => {
      switch (key) {
        case "morning":
          this.changeSunState(0.4, 0.6, 85, 90);
          break;
        case "noon":
          this.changeSunState(1, 0.1, -50, 50);
          break;
        case "evening":
          this.changeSunState(6.5, 2.5, -89, 90);
          break;
        default:
          this.changeSunState(0.4, 0.6, 85, 90);
          break;
      }
    });
  }
}
