/*
 * @Description: 相机控件类
 * @Author: caocong “caocong@hopewind.com”
 * @Date: 2024-11-28 19:38:24
 * @LastEditors: caocong “caocong@hopewind.com”
 * @LastEditTime: 2024-12-04 15:43:28
 * @FilePath: \three-wind\src\components\three\api\control.ts
 * Copyright 2024 Shenzhen Hopewind Electric Co., Ltd, All Rights Reserved.
 */
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import * as Three from "three";

export default class Controls {
  private static _instance: Controls | undefined = undefined;
  controls: OrbitControls | undefined;

  static getInstance() {
    if (!this._instance) this._instance = new Controls();
    return this._instance;
  }

  init(camera: Three.PerspectiveCamera, dom: HTMLElement) {
    this.controls = new OrbitControls(camera, dom);
    // 对相机控件的距离、角度等属性进行控制
    this.controls.minDistance = 800;
    this.controls.maxDistance = 15000;
    this.controls.minPolarAngle = 0.1; // 可以垂直看到XOZ平面
    this.controls.maxPolarAngle = Math.PI / 2 - 0.1; // π/2是水平看到XOY平面，小一点的话就表示不能看到水平的地方
    this.controls.target.set(0, 0, 0);
    this.controls.update();
    return this.controls;
  }

  getCurControl() {
    return this.controls;
  }
}
