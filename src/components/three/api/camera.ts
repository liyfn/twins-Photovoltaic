/*
 * @Description: 相机类
 * @Author: caocong “caocong@hopewind.com”
 * @Date: 2024-11-19 14:41:28
 * @LastEditors: caocong “caocong@hopewind.com”
 * @LastEditTime: 2025-01-22 11:00:30
 * @FilePath: \digital-twin\src\components\three\api\camera.ts
 * Copyright 2024 Shenzhen Hopewind Electric Co., Ltd, All Rights Reserved.
 */
import * as Three from "three";

export default class Camera {
  private static _instance: Camera | undefined = undefined;
  camera!: Three.PerspectiveCamera;
  container!: HTMLElement;

  static getInstance() {
    if (!this._instance) this._instance = new Camera();
    return this._instance;
  }

  init(container: HTMLElement) {
    this.container = container;

    this.camera = new Three.PerspectiveCamera(
      75,
      this.container.clientWidth / this.container.clientHeight,
      0.01,
      100000
    );
    // 相机初始位置设置
    this.camera.position.set(-10000, 5000, 10000);
    this.camera.lookAt(0, 0, 0);
    return this.camera;
  }

  getCurCamera() {
    return this.camera;
  }
}
