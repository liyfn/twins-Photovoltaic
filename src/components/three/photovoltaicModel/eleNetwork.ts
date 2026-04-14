/*
 * @Description: 周围的电网
 * @Author: caocong “caocong@hopewind.com”
 * @Date: 2025-01-21 15:33:06
 * @LastEditors: caocong “caocong@hopewind.com”
 * @LastEditTime: 2025-01-22 14:51:13
 * @FilePath: \digital-twin\src\components\three\photovoltaicModel\eleNetwork.ts
 * Copyright 2025 Shenzhen Hopewind Electric Co., Ltd, All Rights Reserved.
 */
import * as Three from "three";
import modelLoader from "../api/modelLoad";
import Scene from "../api/scene";
import { clone } from "three/addons/utils/SkeletonUtils.js";

export default class EleNetwork {
  cloneCount: number = 5; // 电网克隆的数量
  // 电网克隆的初始位置
  clonePos: Array<[number, number, number]> = [
    [17000, 0, 16000],
    [30000, 0, -20000],
    [-5000, 0, -17000],
    [-23000, 0, 5000],
    [-1000, 0, 25000],
  ];

  constructor() {
    this.init();
  }
  init() {
    // 加载电网模型
    modelLoader("/electric_network.glb", (glb) => {
      this.cloneNetwork(glb, this.cloneCount, this.clonePos);
    });
  }

  cloneNetwork(
    glb: any,
    count: number,
    position: Array<[number, number, number]>
  ) {
    const allMesh: Array<Three.Mesh> = [];
    for (let i = 0; i < count; i++) {
      const mesh = clone(glb.scene);
      allMesh.push(mesh as Three.Mesh);
      allMesh[i].name = `电网${i + 1}号`;
      allMesh[i].position.set(...position[i]);
      // 目前的方阵尺寸是1800
      allMesh[i].scale.set(500, 500, 500);

      Scene.getInstance().addMesh(allMesh[i]);
    }
  }
}
