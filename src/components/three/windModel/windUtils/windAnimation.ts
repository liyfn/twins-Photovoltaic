import * as Three from "three";
import ModelClick from "@/components/three/api/modelClick";
import EventBus from "@/utils/eventBus";
import Camera from "@/components/three/api/camera";
import Controls from "@/components/three/api/control";
import Tween from "@/utils/tween";
import WindHTML from "./windHTML";

export default class WindAnimation {
  private static _instance: WindAnimation | undefined = undefined;
  windMeshList: {
    name: string;
    mesh: Three.Mesh;
  }[] = []; // 存储整体风机的模型
  boomAniArray: Three.AnimationClip[] = []; // 存储爆炸动画的切片数组
  partsMeshArray: {
    [name: string]: Three.Mesh[];
  } = {}; // 存储风机爆炸动画零部件的Mesh和名称
  // 用于记录零部件爆炸图的关键帧动画
  clips: {
    [key: string]: Three.AnimationAction[];
  } = {};
  // 用于记录关键帧动画播放求的句柄
  mixer: {
    [key: string]: Three.AnimationMixer;
  } = {};
  // 用于记录TWEEN动画库的句柄，在循环中更新
  tweenObj: {
    [key: string]: any;
  } = {};
  // 用于保存风机动画的计时器句柄
  timer: any;
  // 用于零部件爆炸的时钟（每个风机的动画时钟都需要单独计算）
  aniClock: {
    [name: string]: Three.Clock;
  } = {};
  // 用来记录离开之前的位置
  lastEnterPos: Three.Vector3 = new Three.Vector3();
  // 用来记录爆炸图进入之前的位置
  lastBoomPos: Three.Vector3 = new Three.Vector3();
  // 记录一下当前正在进行动画的风机名称和动画切片句柄
  windTubineName: string = "";
  mixerName: string = "";
  animationIndex: number = -1;

  cameraClosePos: number[][] = []; // 记录摄像机时靠近标签应该在的位置
  cameraBoomPos: number[][] = []; // 记录摄像机爆炸图时应该在的位置
  clonePos: number[][] = []; // 记录摄像机应该在的位置

  static getInstance() {
    if (!this._instance) this._instance = new WindAnimation();
    return this._instance;
  }

  init(
    windMeshList: {
      name: string;
      mesh: Three.Mesh;
    }[],
    boomAniArray: Three.AnimationClip[],
    partsMeshArray: {
      [name: string]: Three.Mesh[];
    },
    cameraClosePos: number[][],
    cameraBoomPos: number[][],
    clonePos: number[][]
  ) {
    this.windMeshList = windMeshList;
    this.boomAniArray = boomAniArray;
    this.partsMeshArray = partsMeshArray;
    this.cameraBoomPos = cameraBoomPos;
    this.cameraClosePos = cameraClosePos;
    this.clonePos = clonePos;
  }

  // —————————————— 风机扇叶旋转动画相关API ——————————————
  /**
   * @description: 风机旋转动画
   * @param {Three.Object3D} mesh 风机的模型
   * @param { Three.AnimationClip[]} animations 每一个风机对应的动画
   * @param { string} name 每一个风机旋转动画的名字，如blade0
   * @param { number} timeScale 每一个风机旋转动画的播放速度
   */
  bladeRotate(
    mesh: Three.Object3D,
    animations: Three.AnimationClip[],
    name: string,
    timeScale = 0.4
  ) {
    if (!this.mixer[name]) this.mixer[name] = new Three.AnimationMixer(mesh);
    if (!this.clips[name]) this.clips[name] = []; // 同一组动画
    animations.forEach((animation) => {
      const clip = this.mixer[name].clipAction(animation).play();
      clip.timeScale = timeScale;
      this.clips[name].push(clip);
    });
    if (!this.aniClock[name]) this.aniClock[name] = new Three.Clock();
  }
  // 风机的转速调整函数
  changeBladeSpeed(speed: number) {
    for (let name in this.clips) {
      this.clips[name].forEach((item) => {
        item.timeScale = Math.pow(speed / 5, 1.1); // TODO: 目前是个线性的速度变化，后续可以优化
      });
    }
  }

  // —————————————— 风机主标签点击动画相关API ——————————————
  /**
   * @description: 点击近距离展示标签的动画
   * @param {string} name 每一个风机的名字，如风机1号
   * @param {number} index 每一个风机的下标
   */
  goClose({ name, index }: { name: string; index: number }) {
    this.lastEnterPos = Camera.getInstance().camera!.position.clone();
    const targetPos = [
      this.clonePos[index][0],
      this.cameraClosePos[index][1],
      this.clonePos[index][2],
    ] as const;
    this.tweenObj[name] = new Tween(
      Camera.getInstance().camera!.position,
      new Three.Vector3(...this.cameraClosePos[index]),
      1000
    );
    this.tweenObj[name].onStart(() => {
      Controls.getInstance().controls!.enabled = false; // 停用控制器
    });
    this.tweenObj[name].onUpdate(() => {
      Camera.getInstance().camera!.lookAt(...targetPos);
    });
    this.tweenObj[name].onComplete(() => {
      Controls.getInstance().controls?.target.set(...targetPos);
      Controls.getInstance().controls?.update();
      Controls.getInstance().controls!.enabled = true;
      Controls.getInstance().controls!.enableZoom = false; // 禁止缩放
      this.tweenObj[name] = null;
    });
  }
  /**
   * @description: 点击返回的动画
   * @return {*}
   */
  goBack() {
    this.tweenObj["goBack"] = new Tween(
      Camera.getInstance().camera!.position,
      this.lastEnterPos,
      1000
    );
    this.tweenObj["goBack"].onStart(() => {
      Controls.getInstance().controls!.enabled = false; // 停用控制器
    });
    this.tweenObj["goBack"].onUpdate(() => {
      Camera.getInstance().camera!.lookAt(0, 0, 0);
    });
    this.tweenObj["goBack"].onComplete(() => {
      Controls.getInstance().controls!.target.set(0, 0, 0);
      Controls.getInstance().controls!.update();
      Controls.getInstance().controls!.enabled = true;
      Controls.getInstance().controls!.enableZoom = true; // 允许缩放
      this.tweenObj["goBack"] = null;
    });
  }

  // —————————————— 风机爆炸图动画相关API ——————————————
  /**
   * @description: 显示或者隐藏特定的风机部件
   * @param {Three} windMesh 单个风机模型
   * @param {boolean} isShow 是否显示对应的模型
   * @return {*}
   */
  hideOrShowParts(windMesh: Three.Mesh, isShow: boolean) {
    const engineCover = windMesh.getObjectByName("Object_94");
    const blade = windMesh.getObjectByName("Object_76");
    const engine = windMesh.getObjectByName("Object_79");
    const weather = windMesh.getObjectByName("Object_31");
    engineCover!.visible = isShow;
    blade!.visible = isShow;
    engine!.visible = isShow;
    weather!.visible = isShow;
  }
  /**
   * @description: 播放爆炸动画，分为两部分：爆炸出来 和 塞回去
   * @param {string} name 风机播放爆炸图对应动画句柄名称，如boomAni2
   * @param {number} time 动画起始时间，为 0 或 2
   * @param {number} durationTime 动画结束时间，为 2 或 4
   * @return {*}
   */
  animationAll(name: string, time: number, durationTime: number) {
    if (this.timer) clearTimeout(this.timer);
    if (!this.clips[name]) this.clips[name] = [];
    if (!this.clips[name].length) {
      this.boomAniArray.forEach((animation) => {
        const clip = this.mixer[name].clipAction(animation);
        this.clips[name].push(clip);
      });
    }
    this.clips[name].forEach((clip) => {
      clip.paused = false;
      clip.time = time; // 设定开始时间（动画时长4s，爆炸2s，回来2s）
      clip.play();
    });
    this.timer = setTimeout(() => {
      this.clips[name].forEach((clip) => {
        clip.paused = true; // 2s后暂停
      });
    }, durationTime);
    // 时钟记录
    if (!this.aniClock[name]) this.aniClock[name] = new Three.Clock();
  }
  /**
   * @description: 爆炸开始动画
   * @param {string} name 风机播放爆炸图对应动画句柄名称，如boomAni2
   * @param {number} index 风机的对应编号下标
   * @return {*}
   */
  boomAnimation({ name, index }: { name: string; index: number }) {
    this.mixerName = name; // 记录当前动画的句柄名称
    this.windTubineName = `风机${index + 1}号`; // 记录当前动画的风机名称
    this.animationIndex = index; // 记录当前动画的风机序号
    this.lastBoomPos = Camera.getInstance().camera!.position.clone();
    if (!this.mixer[name])
      this.mixer[name] = new Three.AnimationMixer(
        this.windMeshList[index].mesh
      );
    this.tweenObj[name] = new Tween(
      Camera.getInstance().camera!.position,
      new Three.Vector3(...this.cameraBoomPos[index])
    );
    const targetPos = [
      this.clonePos[index][0],
      this.cameraBoomPos[index][1],
      this.clonePos[index][2],
    ] as const;
    this.tweenObj[name].onStart(() => {
      Controls.getInstance().controls!.enabled = false; // 相机控件禁止
      // 隐藏机舱盖
      this.hideOrShowParts(this.windMeshList[index].mesh, false);
      // 隐藏风机的主标签
      WindHTML.getInstance().hideOrShowMainTag(false);
      // 播放动画
      this.animationAll(name, 0, 2000);
    });
    this.tweenObj[name].onUpdate(() => {
      Camera.getInstance().camera!.lookAt(...targetPos);
    });
    this.tweenObj[name].onComplete(() => {
      this.partsMeshArray[this.windTubineName].forEach((item) => {
        ModelClick.getInstance().addMesh(item, (mesh: Three.Mesh) => {
          // 触发事件：渲染2DHTML，展示对应零部件的基础信息
          EventBus.getInstance().emit("partsInfo", {
            mesh, // 单个目标
            name: this.windTubineName,
          });
        });
      });
      this.tweenObj[name] = null;
      Controls.getInstance().controls!.enabled = true;
      Controls.getInstance().controls!.enableZoom = true;
      Controls.getInstance().controls!.minDistance = 1;
      Controls.getInstance().controls!.target.set(
        this.clonePos[index][0],
        this.cameraBoomPos[index][1],
        this.clonePos[index][2]
      );
      Controls.getInstance().controls!.update();
    });
  }
  // 爆炸返回动画
  boomAnimationBack() {
    const targetPos = WindHTML.getInstance().meshPos[this.windTubineName];
    this.tweenObj["boomAniBack"] = new Tween(
      Camera.getInstance().camera!.position,
      this.lastBoomPos
    );
    this.tweenObj["boomAniBack"].onStart(() => {
      Controls.getInstance().controls!.enabled = false;
      Controls.getInstance().controls!.enableZoom = false;
      // 清空所有的DOM和材质的自发光颜色
      // WindHTML.getInstance().resetPartsMeshColor(this.windTubineName);
      WindHTML.getInstance().removeAllPartsHTMLTag(this.windTubineName);
      // 移除单个风机所有的零部件点击事件
      this.partsMeshArray[this.windTubineName].forEach((item) => {
        ModelClick.getInstance().removeMesh(item);
      });
      // 播放动画
      this.animationAll(this.mixerName, 2, 2000);
    });
    this.tweenObj["boomAniBack"].onUpdate(() => {
      Camera.getInstance().camera!.lookAt(targetPos);
    });
    this.tweenObj["boomAniBack"].onComplete(() => {
      // 显示机舱盖
      this.hideOrShowParts(this.windMeshList[this.animationIndex].mesh, true);
      // 显示风机的主标签
      WindHTML.getInstance().hideOrShowMainTag(true);
      Controls.getInstance().controls!.enabled = true;
      this.tweenObj["boomAniBack"] = null;
      Controls.getInstance().controls!.enabled = true;
      Controls.getInstance().controls!.minDistance = 800;
      this.tweenObj["boomAniBack"] = null;
      Controls.getInstance().controls!.target.set(
        WindHTML.getInstance().meshPos[this.windTubineName].x,
        WindHTML.getInstance().meshPos[this.windTubineName].y,
        WindHTML.getInstance().meshPos[this.windTubineName].z
      );
      Controls.getInstance().controls!.update();
    });
  }

  // —————————————— 风机动画相关句柄和Tween动画更新 ——————————————
  loop() {
    // tween动画库的更新方法
    for (let key in this.tweenObj)
      if (this.tweenObj[key]) this.tweenObj[key].update();
    // 关键帧动画更新
    for (let name in this.mixer)
      this.mixer[name].update(this.aniClock[name].getDelta());
  }
}
