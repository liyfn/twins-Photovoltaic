/*
 * @Description: 海水模型
 * @Author: caocong “caocong@hopewind.com”
 * @Date: 2024-11-28 10:02:38
 * @LastEditors: caocong “caocong@hopewind.com”
 * @LastEditTime: 2025-03-05 13:40:37
 * @FilePath: \digital_twins2\src\components\three\api\Sea.ts
 * Copyright 2024 Shenzhen Hopewind Electric Co., Ltd, All Rights Reserved.
 */
import * as Three from "three";
import { Water } from "three/addons/objects/Water.js";
import SeaNormal from "@/assets/img/waternormals.jpg";
import Scene from "./scene";
import EventBus from "@/utils/eventBus";

export default class Sea {
  private static _instacne: Sea | undefined = undefined;
  water: Water | undefined; // 水平面的Mesh
  waterGeo: Three.BufferGeometry; // 水平面的大小和几何体
  speed: number = 2.0; // 模拟大风天气
  sunPos: Three.Vector3 = new Three.Vector3(); // 太阳位置
  sunColor: number = 0xffffff; // 太阳在水面的倒影颜色

  constructor() {
    this.waterGeo = new Three.CircleGeometry(100000); // 水平面的大小和几何体
    this.init();
    this.addEvent();
  }

  static getInstance() {
    if (!this._instacne) this._instacne = new Sea();
    return this._instacne;
  }

  init() {
    // 默认初始时间是早上
    this.changeColorPosAndColor(85, 90, 0xf57969);
    // 新的水模型
    this.water = new Water(this.waterGeo, {
      textureWidth: 512, // 水贴图的宽度    默认值 512
      textureHeight: 512, // 水贴图的高度（值越大细节越多，场景大，值小时缩到远处可能会出现倒影被截断）
      waterNormals: new Three.TextureLoader().load(
        SeaNormal,
        function (texture) {
          // 水模型的法线贴图（不同像素点有不同反光效果）
          // 纹理图片 UV 环绕到目标物体身上的重复方式
          texture.wrapS = texture.wrapT = Three.RepeatWrapping;
        }
      ),
      sunDirection: this.sunPos, // 阳光方向(与灯光方向一致，TODO：将这个换成替换灯光移动)
      sunColor: this.sunColor, // 阳光颜色
      waterColor: new Three.Color(0x000000), // 水颜色  0x001e0f
      distortionScale: 20, // 水倒影分散度（值大越分散）
    });
    this.water.rotation.x = -Math.PI / 2; // 默认模型是垂直于 x 轴，所以翻转
    Scene.getInstance().addMesh(this.water); // 物体模型添加到场景中
  }

  // 改变太阳在水面投影的的位置和颜色
  changeColorPosAndColor(phi: number, theta: number, color: number) {
    // 这个方法是通过三维向量计算位置以及颜色（shader中rgb也是用三维向量表示）
    this.sunPos.setFromSphericalCoords(
      1,
      Three.MathUtils.degToRad(phi),
      Three.MathUtils.degToRad(theta)
    );
    this.sunColor = color;
  }

  addEvent() {
    // 大风天气变化水流速
    EventBus.getInstance().on("changeWindSpeed", (speed: number) => {
      this.speed = speed / 2;
    });
    // 时间系统变化位置
    EventBus.getInstance().on("clickTimeSys", (key: string) => {
      switch (key) {
        case "morning":
          this.changeColorPosAndColor(85, 90, 0xf57969);
          break;
        case "noon":
          this.changeColorPosAndColor(-50, 50, 0xffffff);
          break;
        case "evening":
          this.changeColorPosAndColor(-89, 90, 0xf28d00);
          break;
        default:
          this.changeColorPosAndColor(85, 90, 0xf57969);
          break;
      }
    });
  }

  // 给水波纹做动画
  loop() {
    this.water!.material.uniforms["time"].value += this.speed / 60;
  }
}
