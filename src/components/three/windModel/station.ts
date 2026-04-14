/*
 * @Description: 升压站
 * @Author: caocong “caocong@hopewind.com”
 * @Date: 2024-12-03 14:08:16
 * @LastEditors: caocong “caocong@hopewind.com”
 * @LastEditTime: 2024-12-20 15:49:45
 * @FilePath: \three-wind\src\components\three\model\station.ts
 * Copyright 2024 Shenzhen Hopewind Electric Co., Ltd, All Rights Reserved.
 */
import * as Three from "three";
import modelLoader from "../api/modelLoad";
import Scene from "../api/scene";
import EventBus from "@/utils/eventBus";

export default class Station {
  position: Three.Vector3 = new Three.Vector3();

  constructor(position: number[]) {
    this.position = new Three.Vector3(...position);
    modelLoader("/offshore-station-empty.glb", (glb) => {
      glb.scene.traverse((obj: any) => {
        if (obj.isMesh) {
          obj.material.side = Three.DoubleSide;
        }
      });
      glb.scene.scale.set(8.5, 8.5, 8.5);
      glb.scene.position.set(...position);
      Scene.getInstance().addMesh(glb.scene);
      // 触发事件，给升压站加上对应的HTML标签
      EventBus.getInstance().emit("addMainTag", {
        mesh: glb.scene,
        name: `升压站`,
        index: -1,
        data: [],
        HTML: "stationCom",
      });
    });
  }
}
