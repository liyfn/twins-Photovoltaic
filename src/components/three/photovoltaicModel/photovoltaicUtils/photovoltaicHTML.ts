/*
 * @Description: 光伏块的标签添加
 * @Author: caocong “caocong@hopewind.com”
 * @Date: 2024-12-10 11:21:33
 * @LastEditors: caocong “caocong@hopewind.com”
 * @LastEditTime: 2025-03-03 14:44:08
 * @FilePath: \digital_twins2\src\components\three\photovoltaicModel\photovoltaicUtils\photovoltaicHTML.ts
 * Copyright 2024 Shenzhen Hopewind Electric Co., Ltd, All Rights Reserved.
 */
import { Component, createApp } from "vue";
import * as Three from "three";
import { CSS3DSprite } from "three/addons/renderers/CSS3DRenderer.js";
import { CSS2DObject } from "three/addons/renderers/CSS2DRenderer.js";
import PhotovoltaicCom from "@/components/threeDom/photovoltaicDom/photovoltaicCom.vue";
import PhotovoltaicInfoCom from "@/components/threeDom/photovoltaicDom/photovoltaicInfoCom.vue";
import Scene from "../../api/scene";
import ModelClick from "../../api/modelClick";
import EventBus from "@/utils/eventBus";
import Fire from "@/assets/svg/fire.svg";
import Smoke from "@/assets/svg/smoke.svg";
import PhotoShader from "./photoShader";

export default class PhotovoltaicHTML {
  private static _instance: PhotovoltaicHTML | undefined = undefined;
  // 储存可以点击的逆变器的组
  inverterGroupArray: {
    [name: string]: Three.Group[];
  } = {};
  // 记录目前存在的主标签
  mainTag: {
    [name: string]: any;
  } = {};
  mainDiv: HTMLDivElement[] = [];
  // 记录单个逆变器标签或者其他标签
  inverterTag: {
    [name: string]: any;
  } = {};
  // 记录当前点击的逆变器模型
  inverterName: string = "";
  // 记录目标位置（空物体的位置）
  meshPos: {
    [name: string]: Three.Vector3;
  } = {};
  // HTMLDOM结构保存
  HTMLArr: {
    [name: string]: Component;
  } = {
    photovoltaic: PhotovoltaicCom,
    photovoltaicInfoCom: PhotovoltaicInfoCom,
  };
  // 工况的精灵图的纹理贴图
  fireTexture: Three.Texture;
  smokeTexture: Three.Texture;
  // 存储工况精灵图的列表
  workConditionList: Three.Sprite[] = [];

  constructor() {
    // 初始化工况纹理贴图
    this.fireTexture = new Three.TextureLoader().load(Fire);
    this.smokeTexture = new Three.TextureLoader().load(Smoke);
  }

  static getInstance() {
    if (!this._instance) this._instance = new PhotovoltaicHTML();
    return this._instance;
  }

  init(group: { [name: string]: Three.Group[] }) {
    this.inverterGroupArray = group;
  }

  // —————————— 光伏块主标签显示API ——————————
  // 隐藏或者显示所有的风机主标签
  hideOrShowMainTag(isShow: boolean) {
    this.mainDiv.forEach((div) => {
      div.style.visibility = isShow ? "visible" : "hidden";
    });
  }
  /**
   * @description: 初始化每一个光伏块的标签内容
   * @param {Three} mesh 光伏块对应的空物体Mesh
   * @param {string} name 每一个光伏块的名字，如光伏方阵1号
   * @param {number} index 记录光伏块对应的index值，区分不同的点击事件
   * @param {any} data 每一个光伏块对应数据数组
   * @param {string} HTML 展示的DOM结构
   * @param {string} objectName 空物体的名称
   */
  addMainTag(
    mesh: Three.Mesh,
    name: string,
    index: number,
    data: any,
    HTML: string,
    objectName: string
  ) {
    if (this.mainTag[name]) return;
    const div = document.createElement("div");
    createApp(this.HTMLArr[HTML], {
      name,
      data,
      index,
      mesh,
    }).mount(div);
    this.mainTag[name] = new CSS3DSprite(div);
    this.mainDiv.push(div);
    // 将HTML标签放在准备好的空物体中
    const meshBox = mesh.getObjectByName(objectName);
    meshBox!.add(this.mainTag[name]);
    // 获取空物体的位置，为后续动画做准备
    const pos = new Three.Vector3();
    this.mainTag[name].getWorldPosition(pos);
    this.meshPos[name] = pos;
    // 修改标签的位置和角度
    this.mainTag[name].rotateX(Math.PI / 2);
    this.mainTag[name].scale.set(0.5, 0.5, 0.5);
  }

  // —————————— 逆变器的标签显示/隐藏API ——————————
  /**
   * @description: 增加单个HTML标签
   * @param {Three.Group} group 逆变器部件对应的模型
   * @param {any} data 每个逆变器对应的数据信息
   * @param {string} name 每个光伏方阵对应的动画名字，如光伏方阵1号
   */
  addInverterHTMLTag(group: Three.Group, data: any, name: string) {
    if (group.name === this.inverterName) {
      // 如果名字一致，说明在重复点击
      return;
    } else {
      this.removeAllInverterHTMLTag(name); // 如果没有重复点击，先移除当前的标签和shader扫光
      this.inverterName = group.name; // 记录当前点击的逆变器名字
      // 对应的name只能添加一个html标签，且创建过就不再创建
      if (!this.inverterTag[group.name]) {
        const div = document.createElement("div");
        div.style.pointerEvents = "auto";
        div.onclick = () => {
          this.removeInverterHTMLTag(group);
        };
        createApp(this.HTMLArr.photovoltaicInfoCom, {
          name: group.name,
          data,
        }).mount(div);
        this.inverterTag[group.name] = new CSS2DObject(div);
        this.inverterTag[group.name].rotateX(Math.PI / 2);
        this.inverterTag[group.name].scale.set(0.4, 0.4, 0.4);
      }
      group.add(this.inverterTag[group.name]);
      PhotoShader.getInstance().addInverterSweep(group);
    }
  }
  /**
   * @description: 移除单个HTML标签
   * @param {Three.Group} group 单个逆变器部件对应的模型
   */
  removeInverterHTMLTag(group: Three.Group) {
    if (this.inverterTag[group.name]) {
      this.inverterName = "";
      group.remove(this.inverterTag[group.name]);
      PhotoShader.getInstance().removeInverterSweep();
    }
  }
  /**
   * @description: 清除所有的逆变器模型的标签
   * @param {string} name 每个光伏方阵对应的名字，如光伏方阵1号
   * @return {*}
   */
  removeAllInverterHTMLTag(name: string) {
    this.inverterName = "";
    this.inverterGroupArray[name].forEach((item) => {
      if (this.inverterTag[item.name]) {
        item.remove(this.inverterTag[item.name]);
      }
    });
    PhotoShader.getInstance().removeInverterSweep();
  }

  // —————————— 光伏工况的创建、添加和隐藏 ——————————
  /**
   * @description: 添加工况的Tag标签，目前采用Svg形式，可点击靠近
   * @param {"fire" | "smoke"} type 要创建的工况的类型，这里没有区分，因为同一个位置只可能有一种工况？
   * @param {string} name 要创建的工况的名称，唯一
   * @param {[number, number, number]} pos 要创建的工况的位置
   */
  createWorkConditionSvgTag(
    type: "fire" | "smoke",
    name: string,
    pos: [number, number, number]
  ) {
    this.removeSvgTag(); // 重新创建意味着发生变化，那就先将已经添加的移除，在根据新数据进行添加
    const arr = this.workConditionList.filter((mesh) => mesh.name === name);
    // 如果已经存在了，那就只更换纹理贴图
    if (arr.length) {
      arr[0].material.map = this[`${type}Texture`];
      return;
    }
    // 不存在，就重新创建
    const material = new Three.SpriteMaterial({
      color: 0xffffff,
      map: this[`${type}Texture`],
    });
    const mesh = new Three.Sprite(material);
    mesh.name = name;
    mesh.scale.set(200, 200, 1);
    mesh.position.set(...pos);
    this.workConditionList.push(mesh);
  }
  // 添加到场景中去
  addSvgTag() {
    this.workConditionList.forEach((mesh) => {
      Scene.getInstance().addMesh(mesh);
      // 给每一个 svg mesh 添加点击事件
      ModelClick.getInstance().addMesh(mesh, () => {
        EventBus.getInstance().emit("clickWorkCondition", [
          mesh.position.x,
          mesh.position.y,
          mesh.position.z,
        ]);
      });
    });
  }
  // 从场景中移除
  removeSvgTag() {
    this.workConditionList.forEach((mesh) => {
      Scene.getInstance().removeMesh(mesh);
      // 给每一个 svg mesh 移除点击事件。这么做的原始是因为：射线拾取的模型范围是 addMesh 的 meshlist，如果不以移除，那么即使在 Scene 中移除，还是会触发点击事件
      ModelClick.getInstance().removeMesh(mesh);
    });
  }
}
