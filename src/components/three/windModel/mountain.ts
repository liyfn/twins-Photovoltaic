/*
 * @Description: 加载山地模型
 * @Author: caocong “caocong@hopewind.com”
 * @Date: 2024-11-28 19:44:01
 * @LastEditors: caocong “caocong@hopewind.com”
 * @LastEditTime: 2025-03-05 10:55:12
 * @FilePath: \digital_twins2\src\components\three\windModel\mountain.ts
 * Copyright 2024 Shenzhen Hopewind Electric Co., Ltd, All Rights Reserved.
 */
import modelLoader from "../api/modelLoad";
import Scene from "../api/scene";
// import { clone } from "three/addons/utils/SkeletonUtils.js";

export default class Mountain {
  cloneCount: number = 3; // 山地克隆的数量
  // 山地克隆的位置
  clonePos: Array<[number, number, number]> = [
    [-12000, -100, -15500],
    [1000, -200, -16000],
    [15000, -50, -13000],
  ];
  cloneRotation: number[] = [
    -Math.PI / 2 + 0.3,
    -Math.PI / 2,
    -Math.PI / 2 - 0.3,
  ]; // 山地的旋转角度
  scaleNumber: [number, number, number][] = [
    [5000, 5000, 5000],
    [3000, 6000, 5000],
    [6000, 4000, 5000],
  ];

  constructor() {
    this.init();
  }
  init() {
    // // 加载山地模型
    // modelLoader("/mountain3.glb", (glb) => {
    //   this.cloneMountain(glb, this.cloneCount, this.clonePos);
    // });

    modelLoader("/ocean_mountain.glb", (glb) => {
      glb.scene.scale.set(5, 5, 5);
      glb.scene.rotateY(Math.PI / 3);
      glb.scene.position.set(-10000, 0, -12000);
      // glb.scene.traverse((obj: any) => {
      //   if (obj.isMesh) {
      //     obj.material.side = Three.DoubleSide;
      //   }
      // });
      // 如果觉得在中午时间下，山脉过曝，要么降低太阳光的光照强度，要么将其改为不受光照影响的材质
      // const test = glb.scene.children[1].material as Three.MeshPhysicalMaterial;
      // glb.scene.children[1].material = new Three.MeshBasicMaterial({
      //   color: test.color,
      //   map: test.map,
      // });
      Scene.getInstance().addMesh(glb.scene);
    });
  }

  // cloneMountain(
  //   glb: any,
  //   count: number,
  //   position: Array<[number, number, number]>
  // ) {
  //   const mountainMesh: Array<Three.Mesh> = [];
  //   for (let i = 0; i < count; i++) {
  //     const mesh = clone(glb.scene); // 不太清楚这个clone方法和普通的克隆有什么区别
  //     mountainMesh.push(mesh as Three.Mesh);
  //     mountainMesh[i].name = `山地${i + 1}号`;
  //     mountainMesh[i].position.set(...position[i]);
  //     mountainMesh[i].scale.set(...this.scaleNumber[i]);
  //     mountainMesh[i].rotation.set(0, this.cloneRotation[i], 0);
  //     Scene.getInstance().addMesh(mountainMesh[i]);
  //   }
  // }
}
