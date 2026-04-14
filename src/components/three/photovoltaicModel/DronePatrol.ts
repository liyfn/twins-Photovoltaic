/*
 * @Description: 无人机模型导入，入场自动巡检
 * @Author: caocong “caocong@hopewind.com”
 * @Date: 2025-01-16 09:12:10
 * @LastEditors: caocong “caocong@hopewind.com”
 * @LastEditTime: 2025-01-18 17:31:01
 * @FilePath: \three-wind\src\components\three\photovoltaicModel\DronePatrol.ts
 * Copyright 2025 Shenzhen Hopewind Electric Co., Ltd, All Rights Reserved.
 */
import * as Three from "three";
import modelLoader from "../api/modelLoad";
import Scene from "../api/scene";
import PhotovoltaicAnimation from "./photovoltaicUtils/photovoltaicAnimation";
import EventBus from "@/utils/eventBus";
import { useSettingStore } from "@/store/setting";
import DroneSprite from "@/assets/svg/drone.svg";

export default class Drone {
  private static _instance: Drone | undefined = undefined;
  drone!: Three.Group;
  isShow = false; // 判断是否显示无人机，不显示，就不loop
  droneAnimationList: Three.AnimationClip[] = []; // 保存无人机的螺旋桨旋转动画

  constructor() {
    this.addEvent();
  }

  static getInstance() {
    if (!this._instance) this._instance = new Drone();
    return this._instance;
  }

  init() {
    modelLoader("/drone.glb", (glb) => {
      glb.scene.name = "drone"; // 这里要命名，不加的话，默认是Scene，无法正常加载，具体原因未知
      glb.scene.scale.set(20, 20, 20);
      this.drone = glb.scene.clone(); // 存储无人机模型
      this.droneAnimationList = glb.animations; // 存储动画
      this.addDroneSprite();
      const setting = useSettingStore();
      this.isShow = setting.isShowDrone;
      if (this.isShow) {
        this.addDrone();
        // 如果默认是飞行的，这里需要调用一下
        PhotovoltaicAnimation.getInstance().startDronePatrol(
          this.drone,
          this.droneAnimationList
        );
      }
    });
  }
  // 添加无人机巡查
  addDrone() {
    Scene.getInstance().addMesh(this.drone);
    this.isShow = true;
  }
  // 关闭无人机巡查
  removeDrone() {
    Scene.getInstance().removeMesh(this.drone);
    this.isShow = false;
  }
  // 给无人机添加精灵图
  addDroneSprite() {
    const texture = new Three.TextureLoader().load(DroneSprite);
    const material = new Three.SpriteMaterial({
      color: 0xff00ff,
      map: texture,
    });
    const mesh = new Three.Sprite(material);
    mesh.scale.set(10, 10, 1);
    mesh.position.set(0, 7, 0);
    this.drone?.add(mesh);
  }
  // 添加监听事件
  addEvent() {
    // 监听：点击返回按钮，退出第一人称模式
    EventBus.getInstance().on("goOrBackDroneFollow", (val) => {
      !val && PhotovoltaicAnimation.getInstance().backByFirstPerson();
    });
  }

  // 清空所有的模型
  clearAll() {
    this.removeDrone();
  }
}
