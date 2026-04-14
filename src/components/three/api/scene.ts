/*
 * @Description: 场景类
 * @Author: caocong “caocong@hopewind.com”
 * @Date: 2024-11-28 19:38:24
 * @LastEditors: caocong “caocong@hopewind.com”
 * @LastEditTime: 2025-05-15 09:12:13
 * @FilePath: \digital_twins2\src\components\three\api\scene.ts
 * Copyright 2024 Shenzhen Hopewind Electric Co., Ltd, All Rights Reserved.
 */
import * as Three from "three";

export default class Scene {
  private static _instance: Scene | undefined = undefined;
  scene: Three.Scene;
  meshList: (Three.Mesh | Three.Line | Three.Group | Three.Sprite)[];
  fbo!: Three.WebGLRenderTarget;

  constructor() {
    this.scene = new Three.Scene();
    this.meshList = [];
  }

  static getInstance() {
    if (!this._instance) this._instance = new Scene();
    return this._instance;
  }

  init(container: HTMLElement) {
    const renderTargetParameters: Three.RenderTargetOptions = {
      minFilter: Three.LinearFilter, // 定义了当被纹理化的像素映射到大于1纹理元素（texel）的区域时，将要使用的纹理缩小函数。LinearMipmapLinearFilter是默认值
      magFilter: Three.LinearFilter, // 定义了当被纹理化的像素映射到小于或者等于1纹理元素（texel）的区域时，将要使用的纹理放大函数。 LinearFilter：返回距离指定的纹理坐标最近的四个纹理元素的加权平均值，默认值
      stencilBuffer: false, // 渲染到模板缓冲区。默认为false.
    };
    this.fbo = new Three.WebGLRenderTarget(
      container.clientWidth,
      container.clientHeight,
      renderTargetParameters
    );
    return this.scene;
  }
  // 加载科技风场景基础地面场景
  createTechFloor() {
    const floorGeometry = new Three.CircleGeometry(100000);
    const floorMaterial = new Three.MeshLambertMaterial({
      color: 0x001f4c,
    });
    const floorMesh = new Three.Mesh(floorGeometry, floorMaterial);
    floorMesh.position.set(0, -5, 0);
    floorMesh.rotateX(-Math.PI / 2);
    floorMesh.name = "科技风地面";
    this.addMesh(floorMesh);
  }
  // 将模型添加到场景
  addMesh(mesh: Three.Mesh | Three.Line | Three.Group | Three.Sprite) {
    this.meshList.push(mesh);
    this.scene.add(mesh);
  }
  // 将模型从场景移除
  removeMesh(mesh: Three.Mesh | Three.Line | Three.Group | Three.Sprite) {
    this.scene.remove(mesh);
  }
  // 清空所有模型
  clearAll() {
    this.meshList.forEach((mesh) => {
      this.removeMesh(mesh);
    });
    this.meshList = [];
  }

  getCurScene() {
    return this.scene;
  }
}
