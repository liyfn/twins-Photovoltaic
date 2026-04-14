/*
 * @Description: 光伏的整体模型
 * @Author: caocong “caocong@hopewind.com”
 * @Date: 2024-12-18 16:47:20
 * @LastEditors: caocong “caocong@hopewind.com”
 * @LastEditTime: 2025-05-15 09:09:49
 * @FilePath: \digital_twins2\src\components\three\photovoltaicModel\photovoltaicAll.ts
 * Copyright 2024 Shenzhen Hopewind Electric Co., Ltd, All Rights Reserved.
 */
import * as Three from "three";
import modelLoader from "../api/modelLoad";
import Scene from "../api/scene";
import EventBus from "@/utils/eventBus";
import PhotovoltaicHTML from "./photovoltaicUtils/photovoltaicHTML";
import PhotovoltaicAnimation from "./photovoltaicUtils/photovoltaicAnimation";
import Drone from "./DronePatrol";
import DronePath from "./photovoltaicUtils/dronePath";
import RipperReminder from "../api/rippleReminder";
import PhotoShader from "./photovoltaicUtils/photoShader";

export default class PhotovoltaicAll {
  photovoltaicMeshList: {
    name: string;
    mesh: any;
  }[] = []; // 存储整体风机的模型
  // 储存可以点击的逆变器的组
  inverterGroupArray: {
    [name: string]: Three.Group[];
  } = {};
  readonly cloneCount: number = 8; // 光伏方阵的数量

  constructor(data: any) {
    this.init(data);
    this.addEvent();
  }
  init(data: any) {
    // 加载光伏厂区主模型
    modelLoader("/panel_square_all_compress_new.glb", (glb) => {
      const photoMeshGroup: Three.Object3D[] = [];
      glb.scene.children.forEach((child: Three.Object3D) => {
        if (child.name === "photovoltaic_room") {
          // 光伏方阵内的建筑，目前不做处理
        } else if (child.name === "road") {
          // 处理公路模型，可接收阴影
          child.traverse((obj: any) => {
            if (obj.isMesh) {
              obj.castShadow = true;
            }
          });
        } else if (child.name === "other_constrct") {
          // 给周围建筑增加光带
          PhotoShader.getInstance().roomLightBand(child);
        } else {
          // 保存光伏方阵模型
          photoMeshGroup.push(child);
        }
      });
      // 因为排列方式的问题，这里将其他的模型排除后，进行保存，然后重新存储
      photoMeshGroup.forEach((child, index) => {
        // 处理光伏阵列模型，保存每一个光伏方阵块
        this.photovoltaicMeshList.push({
          name: `光伏方阵${index + 1}号`,
          mesh: child,
        });
        // 保存可以点击的逆变器的group
        if (!this.inverterGroupArray[`光伏方阵${index + 1}号`])
          this.inverterGroupArray[`光伏方阵${index + 1}号`] = [];
        child.traverse((obj: any) => {
          if (obj.name.includes("逆变器00")) {
            // 保存逆变器模型组
            this.inverterGroupArray[`光伏方阵${index + 1}号`].push(obj);
          } else if (obj.name.includes("photovoltaic_floor")) {
            // 只设置地面可以接受阴影
            obj.children.forEach((item: any) => {
              item.receiveShadow = true;
              item.material.shadowSide = Three.BackSide; // 选择背面接收阴影
            });
          }
          if (obj.isMesh) {
            obj.castShadow = true; // 设置每一个模型可以产生阴影
          }
        });
      });

      // 初始化无人机路径所需的顶点参数
      DronePath.getInstance().init(photoMeshGroup, 29);
      // 初始化无人机
      Drone.getInstance().init(); // 加载无人机类，后续根据需求，动态初始化

      // 初始化方阵动画所需的参数
      PhotovoltaicHTML.getInstance().init(this.inverterGroupArray);
      PhotovoltaicAnimation.getInstance().init(
        this.photovoltaicMeshList,
        PhotovoltaicHTML.getInstance().meshPos,
        this.inverterGroupArray,
        DronePath.getInstance().curve!
      );

      glb.scene.scale.set(29, 29, 29);
      glb.scene.position.set(0, 0, 0);
      Scene.getInstance().addMesh(glb.scene);

      // 触发初始的事件
      this.emitEvent(data);
    });
  }

  // 添加监听事件
  addEvent() {
    // 监听初始化添加标签的事件
    EventBus.getInstance().on(
      "addPhotovoltaicTag",
      ({ mesh, name, index, data, HTML, objectName }) => {
        PhotovoltaicHTML.getInstance().addMainTag(
          mesh,
          name,
          index,
          data,
          HTML,
          objectName
        );
      }
    );
    // 监听点击标签靠近光伏方阵的动画
    EventBus.getInstance().on(
      "goPhotovoltaicCloseOrBack",
      ({ isClose, index, name }) => {
        isClose
          ? PhotovoltaicAnimation.getInstance().goClose({ name, index })
          : PhotovoltaicAnimation.getInstance().goBack();
      }
    );
    // 监听点击标签靠近逆变器亭子的动画
    EventBus.getInstance().on("goInverterCloseOrBack", (val) => {
      val
        ? PhotovoltaicAnimation.getInstance().goInverterAnimation()
        : PhotovoltaicAnimation.getInstance().goInverterAniBack();
    });
    // 监听事件：渲染2DHTML，展示对应逆变器的基础信息
    EventBus.getInstance().on("inverterInfo", ({ group, name }) => {
      PhotovoltaicHTML.getInstance().addInverterHTMLTag(
        group,
        { name: "逆变器 ", status: "正常" },
        name
      );
    });
    // 监听事件：显示或者隐藏风机的主标签
    EventBus.getInstance().on("HideOrShowMainTag", (isHideAllTag) => {
      PhotovoltaicHTML.getInstance().hideOrShowMainTag(isHideAllTag);
    });
    // 监听事件：无人机路径是否显示
    EventBus.getInstance().on("settingShowDronePath", (val) => {
      if (val) DronePath.getInstance().showDronePath();
      else DronePath.getInstance().hiddenDronePath();
    });
    // 监听事件：无人机是否显示
    EventBus.getInstance().on("settingShowDrone", (val) => {
      if (val) Drone.getInstance().addDrone();
      else Drone.getInstance().removeDrone();
      PhotovoltaicAnimation.getInstance().isDronePaused(
        !val,
        Drone.getInstance().drone!,
        Drone.getInstance().droneAnimationList
      );
    });
    // 监听事件：添加光伏方阵的底部波纹提示
    EventBus.getInstance().on(
      "addPhotovoltaicDiffusion",
      ({ name, color, pos, rotateNegative }) => {
        RipperReminder.getInstance().addDiffusion(
          name,
          color,
          pos,
          500,
          rotateNegative
        );
      }
    );
    // 监听事件：移除模型底部波纹提示
    EventBus.getInstance().on("removePhotovoltaicDiffusion", ({ name }) => {
      RipperReminder.getInstance().removeDiffusion(name);
    });
    // 监听事件：添加光伏方阵的工况Svg提示
    EventBus.getInstance().on(
      "addPhotovoltaicWorkCondition",
      ({ name, type, pos }) => {
        // 先创建
        PhotovoltaicHTML.getInstance().createWorkConditionSvgTag(
          type,
          name,
          pos
        );
        // 后添加
        PhotovoltaicHTML.getInstance().addSvgTag();
      }
    );
    // 监听事件：添加光伏方阵的工况Svg点击动画
    EventBus.getInstance().on("clickWorkCondition", (pos) => {
      PhotovoltaicAnimation.getInstance().clickWorkCondition(pos);
    });
    // 监听事件：是否显示光伏方阵的工况
    EventBus.getInstance().on("hiddenOrShowWork", (val) => {
      if (val) PhotovoltaicHTML.getInstance().addSvgTag();
      else PhotovoltaicHTML.getInstance().removeSvgTag();
    });
    // 监听事件：用于 扫描/停止 组串扫光特效
    EventBus.getInstance().on(
      "panelSeriesSweep",
      ({
        index,
        row,
        state,
      }: {
        index: number;
        row: number;
        state: boolean;
      }) => {
        const mesh = this.photovoltaicMeshList[index].mesh;
        state
          ? PhotoShader.getInstance().addPanelSweep(mesh, row)
          : PhotoShader.getInstance().removePanelSweep(mesh, row);
      }
    );
  }

  /**
   * @description: 触发初始事件的方法
   * @param {Three.Object3D} roomGroup 厂房的模型
   * @param {any} data 光伏方阵的响应式数据
   * @return {*}
   */
  emitEvent(data: any) {
    // 触发事件，给每一个光伏方阵加上对应的HTML标签
    this.photovoltaicMeshList.forEach((item, index: number) => {
      EventBus.getInstance().emit("addPhotovoltaicTag", {
        mesh: item.mesh,
        name: item.name,
        index,
        data,
        HTML: "photovoltaic",
        objectName: `HTMLTagEmpty${index + 1}`,
      });
    });
    // 方阵的模型加载完毕之后，触发入场动画
    EventBus.getInstance().emit("entryAnimationOrEnd", {
      isStart: true,
      endPos: [6000, 1500, 0],
      time: 2000,
    });
  }
}
