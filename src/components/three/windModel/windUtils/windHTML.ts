import { Component, createApp } from "vue";
import * as Three from "three";
import { CSS3DSprite } from "three/addons/renderers/CSS3DRenderer.js";
import { CSS2DObject } from "three/addons/renderers/CSS2DRenderer.js";
import windTurbine from "@/components/threeDom/windDom/windTurbine.vue";
import stationCom from "@/components/threeDom/windDom/stationCom.vue";
import infoCom from "@/components/threeDom/windDom/infoCom.vue";
import WindShader from "./windShader";
import globalLayer from "@/config/layerConfig";

export default class WindHTML {
  private static _instance: WindHTML | undefined = undefined;
  partsMeshArray: {
    [name: string]: Three.Mesh[];
  } = {}; // 存储风机爆炸动画零部件的Mesh和名称
  // 记录目前存在的标签
  mainTag: {
    [name: string]: any;
  } = {};
  mainDiv: HTMLDivElement[] = [];
  partsTag: {
    [name: string]: any;
  } = {};
  // 记录目标位置
  meshPos: {
    [name: string]: Three.Vector3;
  } = {};
  HTMLArr: {
    [name: string]: Component;
  } = {
    windTurbine: windTurbine,
    stationCom: stationCom,
  };
  windPartsName: string = "";

  static getInstance() {
    if (!this._instance) this._instance = new WindHTML();
    return this._instance;
  }

  init(partsMeshArray: { [name: string]: Three.Mesh[] }) {
    this.partsMeshArray = partsMeshArray;
  }

  // —————————————— 风机主信息标签显示相关API ——————————————
  // 隐藏或者显示所有的风机主标签
  hideOrShowMainTag(isShow: boolean) {
    this.mainDiv.forEach((div) => {
      div.style.visibility = isShow ? "visible" : "hidden"; // 这里display不起作用，原因不明
    });
  }
  /**
   * @description: 初始化每一个风机的标签内容
   * @param {Three} mesh 风机对应的Mesh
   * @param {string} name 每一个风机的名字，如风机1号
   * @param {number} index 记录风机对应的index值，区分不同的点击事件
   * @param {WindTurbineTag[]} data 每一个风机对应数据数组
   * @param {string} HTML 风机渲染的标签对应的字符串
   */
  addMainTag(
    mesh: Three.Mesh,
    name: string,
    index: number,
    data: any[],
    HTML: string
  ) {
    if (this.mainTag[name]) return; // 已经存在就不再添加
    const div = document.createElement("div");
    // 新建一个根节点，用于渲染标签
    createApp(this.HTMLArr[HTML], {
      name,
      data,
      index,
    }).mount(div);
    this.mainTag[name] = new CSS3DSprite(div);
    this.mainDiv.push(div);
    // 将HTML标签放在准备好的空物体中
    const meshBox = mesh.getObjectByName("HTMLTagEmpty");
    meshBox!.add(this.mainTag[name]);
    // 获取空物体的位置，为后续动画做准备
    const pos = new Three.Vector3();
    this.mainTag[name].getWorldPosition(pos);
    this.meshPos[name] = pos;
    // 修改标签的位置和角度
    this.mainTag[name].rotateX(Math.PI / 2);
    this.mainTag[name].scale.set(0.5, 0.5, 0.5);
  }

  // —————————————— 风机零部件爆炸提标签显示相关API ——————————————
  /**
   * @description: 增加单个HTML标签
   * @param {Three} mesh 风机零部件对应的模型
   * @param {any} data 每个零部件对应的数据信息
   * @param {string} name 每个风机对应的动画名字，如风机1号
   */
  addPartsHTMLTag(mesh: Three.Mesh, data: any, name: string) {
    // BUG：重复点击同一个，会一直执行底下的除if以外的命令，要不就加个变量表明当前点击的是哪个
    // 加载其他标签时，先将已有的标签清除，由于不知道上一次添加的是哪个，所以将全部的都清除
    if (this.windPartsName === mesh.name) {
      // 如果名字一致，说明在重复点击
      return;
    }
    // this.resetPartsMeshColor(name);
    this.removeAllPartsHTMLTag(name);
    this.windPartsName = mesh.name;
    // 这里不能判断有没有这个标签，因为这里同一个mesh的name一致，与光伏的不同，光伏的group.name不同！
    const div = document.createElement("div");
    div.style.pointerEvents = "auto"; // 将之前屏蔽全部的点击改为只显示div所在地方的点击可见，增加click函数
    // 点击DOM关闭自发光
    div.onclick = () => {
      this.removeHTMLTag(mesh);
    };
    createApp(infoCom, {
      name: mesh.name,
      data,
    }).mount(div);
    this.partsTag[mesh.name] = new CSS2DObject(div);
    this.partsTag[mesh.name].layers.set(globalLayer.signalLayer);
    this.partsTag[mesh.name].rotateX(Math.PI / 2);
    this.partsTag[mesh.name].scale.set(0.5, 0.5, 0.5);
    mesh.add(this.partsTag[mesh.name]);
    WindShader.getInstance().addPartsSweep(mesh);
    // (mesh.material as any).emissive = new Three.Color(0xff0000);
  }
  /**
   * @description: 移除单个HTML标签
   * @param {Three.Mesh} mesh 风机零部件对应的模型
   */
  removeHTMLTag(mesh: Three.Mesh) {
    if (this.partsTag[mesh.name]) {
      // 理应不需要判断，因为只有在有HTML标签的时候才能触发这个事件
      this.windPartsName = "";
      mesh.remove(this.partsTag[mesh.name]);
      // (mesh.material as any).emissive = new Three.Color(0x000000);
      WindShader.getInstance().removePartsSweep();
    }
  }
  // /**
  //  * @description: 清除所有零部件的自发光
  //  * @param {string} name 每个风机对应的名字，如风机1号
  //  */
  // resetPartsMeshColor(name: string) {
  //   this.partsMeshArray[name].forEach((item) => {
  //     (item.material as any).emissive = new Three.Color(0x000000);
  //   });
  // }
  /**
   * @description: 清除所有的零部件模型的标签
   * @param {string} name 每个风机对应的名字，如风机1号
   */
  removeAllPartsHTMLTag(name: string) {
    this.windPartsName = "";
    this.partsMeshArray[name].forEach((item) => {
      if (this.partsTag[item.name]) {
        item.remove(this.partsTag[item.name]);
      }
    });
    WindShader.getInstance().removePartsSweep();
  }
}
