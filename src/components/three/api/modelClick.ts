/*
 * @Description: 模型的点击事件
 * @Author: caocong “caocong@hopewind.com”
 * @Date: 2024-11-19 16:03:00
 * @LastEditors: caocong “caocong@hopewind.com”
 * @LastEditTime: 2025-02-28 14:27:45
 * @FilePath: \digital_twins2\src\components\three\api\modelClick.ts
 * Copyright 2024 Shenzhen Hopewind Electric Co., Ltd, All Rights Reserved.
 */
import * as Three from "three";

export default class ModelClick {
  private static _instance: ModelClick | undefined = undefined;
  private meshList: (Three.Mesh | Three.Sprite | Three.Group)[];
  private eventList: Map<string, Function>;
  private container: HTMLElement | undefined;
  private renderDom: HTMLElement | undefined;
  private camera: Three.Camera | undefined;
  raycaster = new Three.Raycaster();

  constructor() {
    this.meshList = [];
    this.eventList = new Map();
    this.raycaster.layers.enableAll();
  }

  static getInstance() {
    if (!this._instance) this._instance = new ModelClick();
    return this._instance;
  }
  // 初始化射线拾取
  init(camera: Three.Camera, container: HTMLElement, renderDom: HTMLElement) {
    this.camera = camera;
    this.container = container;
    this.renderDom = renderDom;
    // 监听Mesh点击事件
    this.renderDom.addEventListener("click", (target) => {
      const x = (target.offsetX / this.container!.offsetWidth!) * 2 - 1;
      const y = -(target.offsetY / this.container!.offsetHeight!) * 2 + 1;
      this.raycaster.setFromCamera(new Three.Vector2(x, y), this.camera!);
      // 这里是meshList，意味着只针对手动添加进行来的模型，不管这个模型有没有加载到scene中！！
      const intersects = this.raycaster.intersectObjects(this.meshList, true); // targetGroup.children
      if (intersects.length) {
        // 风电的每一个都是最后的Mesh了，但是光伏的是一个Group(逆变器、无人机都是)
        if (this.eventList.get(intersects[0].object.name))
          this.eventList.get(intersects[0].object.name)?.(intersects[0].object);
        else if (this.eventList.get(intersects[0].object.parent!.name))
          this.eventList.get(intersects[0].object.parent!.name)?.(
            intersects[0].object.parent
          );
      }
    });
  }
  // 只针对特定的mesh模型开启射线拾取
  addMesh(mesh: Three.Mesh | Three.Sprite | Three.Group, callback: Function) {
    this.meshList.push(mesh);
    this.eventList.set(mesh.name, callback);
  }
  // 移除mesh的事件
  removeMesh(mesh: Three.Mesh | Three.Sprite | Three.Group) {
    this.eventList.delete(mesh.name);
  }
}
