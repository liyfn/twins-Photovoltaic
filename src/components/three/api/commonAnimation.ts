import * as Three from "three";
import Tween from "@/utils/tween";
import Controls from "./control";
import Camera from "./camera";
import EventBus from "@/utils/eventBus";

export default class CommonAnimation {
  private static _instance: CommonAnimation | undefined = undefined;
  // 用于记录TWEEN动画库的句柄，在循环中更新
  tweenObj: {
    [key: string]: any;
  } = {};
  // 巡检动画的角度设置
  inspectionAngle = 0;
  isEndEntry = false; // 是否第一次触发入场动画
  isInspection = false;
  radius = 60; // 巡检时会扩大100倍
  isAutoInspect = true; // 判断是否自动巡检的标志位，默认自动巡检

  constructor() {
    this.addEvent();
  }

  static getInstance() {
    if (!this._instance) this._instance = new CommonAnimation();
    return this._instance;
  }

  // 对可以动态更改的属性进行初始化，目前是巡检半径和入场后自动巡检
  init(radius: number, isAutoInspect: boolean) {
    this.radius = radius ?? 60;
    this.isAutoInspect = isAutoInspect ?? true;
  }

  /**
   * @description: 由外部用户设置一些状态
   * @param {number} radius 巡检的半径长度，默认6000
   * @param {boolean} isAutoInspect 入场动画是否自动巡检，默认为true
   */
  settingRadius(radius: number) {
    this.radius = radius;
  }
  settingAutoInspect(isAutoInspect: boolean) {
    this.isAutoInspect = isAutoInspect;
  }

  /**
   * @description: 入场动画
   * @param {[number,number,number]} endPos 终止位置
   * @param {number} time 时间跨度，默认2s
   */
  entryAnimation(endPos: number[], time = 2000) {
    this.tweenObj["entryAnimation"] = new Tween(
      Camera.getInstance().camera!.position,
      {
        x: endPos[0],
        y: endPos[1],
        z: endPos[2],
      },
      time
    );
    this.tweenObj["entryAnimation"].onStart(() => {
      Controls.getInstance().controls!.enabled = false;
    });
    this.tweenObj["entryAnimation"].onUpdate(() => {
      Camera.getInstance().camera!.lookAt(0, 0, 0);
    });
    this.tweenObj["entryAnimation"].onComplete(() => {
      this.tweenObj["entryAnimation"] = null;
      Controls.getInstance().controls!.enabled = true;
      EventBus.getInstance().emit("entryAnimationOrEnd", false); // 出现巡检按钮
      this.isAutoInspect &&
        EventBus.getInstance().emit("inspectionStartOrEnd", true); // 巡检开始，默认开始巡检
    });
  }

  // 巡检动画
  inspectionAnimation() {
    Controls.getInstance().controls!.enabled = false; // 停用控制器
    // 在入场动画结束自动进入巡检动画时，不需要执行这个，位置都是算好的
    if (this.isAutoInspect && !this.isEndEntry && this.radius == 60) {
      this.isInspection = true;
      this.isEndEntry = true;
      return;
    }

    // 方向向量，这里Y方向要置0，因为半径指的是XOZ平面，方向也要与Y无关，这样才对，最后要归一化
    const dir = new Three.Vector3(
      Camera.getInstance().camera!.position.x,
      0,
      Camera.getInstance().camera!.position.z
    );
    const y = Camera.getInstance().camera!.position.y;
    const len = dir.length();

    const actualR = this.radius * 100;
    // 如果已经在附近了，就不需要在移动了，这里放大的比较多，设置的范围是±100
    if (y < 1600 && y > 1400 && len <= actualR + 100 && len >= actualR - 100) {
      this.isInspection = true;
      return;
    }
    dir.normalize();
    const target = dir.clone().multiplyScalar(actualR); // 沿相机视线方向平移的长度就是半径长度，可以计算到目标位置
    this.tweenObj["startInspect"] = new Tween(
      Camera.getInstance().camera!.position,
      {
        x: target.x,
        y: 1500,
        z: target.z,
      }
    );
    this.tweenObj["startInspect"].onUpdate(() => {
      Camera.getInstance().camera!.lookAt(0, 0, 0);
    });
    this.tweenObj["startInspect"].onComplete(() => {
      // 计算当前角度
      this.inspectionAngle = Math.asin(target.z / actualR);
      // 由于sin函数特性，需要对二三象限的角度进行修正
      if (target.x < 0) {
        if (target.z < 0)
          this.inspectionAngle = -Math.PI - this.inspectionAngle;
        else this.inspectionAngle = Math.PI - this.inspectionAngle;
      }
      this.isInspection = true;
      this.tweenObj["startInspect"] = null;
    });
  }
  // 重置巡检动画的初始参数
  clearInspectionAnimation() {
    this.tweenObj["startInspect"] = null; // 有可能还没有到目标位置，就停止巡检
    this.isInspection = false;
    Controls.getInstance().controls!.enabled = true;
  }
  // loop循环与tween动画库的更新
  loop() {
    // tween更新
    for (let key in this.tweenObj) {
      if (this.tweenObj[key]) this.tweenObj[key].update();
    }
    // 其他数值变化
    if (!this.isInspection) return;
    this.inspectionAngle += (2 * Math.PI) / 3000;
    Camera.getInstance().camera!.position.x =
      this.radius * 100 * Math.cos(this.inspectionAngle);
    Camera.getInstance().camera!.position.z =
      this.radius * 100 * Math.sin(this.inspectionAngle);
    Camera.getInstance().camera!.lookAt(0, 0, 0);
  }

  addEvent() {
    // 入场动画开始
    EventBus.getInstance().on(
      "entryAnimationOrEnd",
      ({ isStart, endPos, time }) => {
        isStart && this.entryAnimation(endPos, time);
      }
    );
    // 开始巡检  结束巡检
    EventBus.getInstance().on("inspectionStartOrEnd", (val) => {
      val ? this.inspectionAnimation() : this.clearInspectionAnimation();
    });
    // 是否开启入场动画后自动巡检
    EventBus.getInstance().on("settingAutoInspect", (val) => {
      this.settingAutoInspect(val);
    });
    // 更改巡检的半径，只能在非巡检过程中才可以更改
    EventBus.getInstance().on("settingRadius", (val) => {
      this.settingRadius(val);
    });
  }
}
