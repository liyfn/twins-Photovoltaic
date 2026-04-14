/*
 * @Description: 灯光类
 * @Author: caocong “caocong@hopewind.com”
 * @Date: 2024-11-19 15:28:43
 * @LastEditors: caocong “caocong@hopewind.com”
 * @LastEditTime: 2025-02-28 14:48:41
 * @FilePath: \digital_twins2\src\components\three\api\light.ts
 * Copyright 2024 Shenzhen Hopewind Electric Co., Ltd, All Rights Reserved.
 */
import * as Three from "three";
import Scene from "./scene";
import EventBus from "@/utils/eventBus";

export default class Light {
  private static _instance: Light | undefined = undefined;
  light: Three.Light[] = [];

  constructor() {
    this.init();
    this.addEvent();
  }

  static getInstance() {
    if (!this._instance) this._instance = new Light();
    return this._instance;
  }

  private init() {
    // 环境光
    const ambientLight = new Three.AmbientLight(0xffffff, 0.5);
    ambientLight.name = "环境光";
    this.light.push(ambientLight);
    ambientLight.layers.enableAll();
    Scene.getInstance().scene.add(ambientLight);

    // 平行光模拟太阳光
    const directionLight = new Three["DirectionalLight"](0xffffff, 5);
    directionLight.name = "太阳光";
    // 光线会产生阴影
    directionLight.castShadow = true;
    // 设置三维场景计算阴影的范围
    directionLight.shadow.camera.left = -20000;
    directionLight.shadow.camera.right = 20000;
    directionLight.shadow.camera.top = 20000;
    directionLight.shadow.camera.bottom = -20000;
    directionLight.shadow.camera.near = 0.01;
    directionLight.shadow.camera.far = 20000;
    directionLight.shadow.mapSize.set(2048, 2048);
    this.light.push(directionLight);
    directionLight.layers.enableAll();
    Scene.getInstance().scene.add(directionLight);

    // 初始化灯光系统
    this.changeLightIntenAndPos(0.5, 3.5, [10000, 3000, 2000]);
  }

  // 改变的环境光和太阳光的光照强度和位置
  changeLightIntenAndPos(
    ambientIntensity: number,
    directionIntensity: number,
    directionPos: [number, number, number]
  ) {
    this.light[0].intensity = ambientIntensity;
    this.light[1].intensity = directionIntensity;
    this.light[1].position.set(...directionPos);
  }
  // 在外部动态添加灯光，需要自己将其添加到scene中，方便外部动态管理
  addLight(
    lightType: string,
    lightName: string,
    lightIntensity: number,
    lightColor: number,
    lightPos?: [number, number, number]
  ) {
    const newLight = new (Three as any)[lightType](lightColor, lightIntensity);
    newLight.name = lightName;
    lightPos && newLight.position.set(...lightPos);
    this.light.push(newLight);
    Scene.getInstance().scene.add(newLight);
    return newLight;
  }
  // 监听事件
  addEvent() {
    // 时间系统变化位置
    EventBus.getInstance().on("clickTimeSys", (key: string) => {
      switch (key) {
        case "morning":
          this.changeLightIntenAndPos(1.0, 3.5, [10000, 3000, 2000]);
          break;
        case "noon":
          this.changeLightIntenAndPos(1.2, 4.0, [2000, 6000, 3000]);
          break;
        case "evening":
          this.changeLightIntenAndPos(1.0, 3.5, [-10000, 3000, 2000]);
          break;
        default:
          this.changeLightIntenAndPos(1.0, 3.5, [10000, 3000, 2000]);
          break;
      }
    });
  }
  // 清空所有的灯光
  clearAll() {
    this.light.forEach((item) => {
      Scene.getInstance().scene.remove(item);
    });
    this.light = [];
  }

  getCurLight() {
    return this.light;
  }
}
