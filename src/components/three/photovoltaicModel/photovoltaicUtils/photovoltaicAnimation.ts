import * as Three from "three";
import ModelClick from "@/components/three/api/modelClick";
import EventBus from "@/utils/eventBus";
import Camera from "@/components/three/api/camera";
import Controls from "@/components/three/api/control";
import Tween from "@/utils/tween";
import PhotovoltaicHTML from "./photovoltaicHTML";

export default class PhotovoltaicAnimation {
  private static _instance: PhotovoltaicAnimation | undefined = undefined;
  photovoltaicMeshList: {
    name: string;
    mesh: Three.Mesh;
  }[] = []; // 存储整体风机的模型
  // 记录目标位置（逆变器亭子的位置）
  photovoltaicSquarePos: {
    [name: string]: Three.Vector3;
  } = {};
  // 储存可以点击的逆变器的组
  inverterGroupArray: {
    [name: string]: Three.Group[];
  } = {};
  // 用于记录关键帧动画播放求的句柄
  mixer: {
    [key: string]: Three.AnimationMixer;
  } = {};
  // 记录无人机动画
  droneAction: Three.AnimationAction | undefined = undefined;
  // 用于无人机飞行动画的时钟
  droneClock: Three.Clock | undefined = undefined;
  // 用于记录TWEEN动画库的句柄，在循环中更新
  tweenObj: {
    [key: string]: any;
  } = {};
  // 用来记录离开之前的位置
  lastEnterPos: Three.Vector3 = new Three.Vector3();
  beforeEnterInveterPos: Three.Vector3 = new Three.Vector3();
  // 用来记录当前的光伏方阵是哪一个
  photovoltaicName!: string;
  photovoltaicIndex!: number;
  // 记录无人机的mesh
  droneMesh: Three.Group | undefined = undefined;
  // 记录无人机的运动轨迹
  curve!: Three.CatmullRomCurve3;
  // 判断当前是否进入了第一人称模式
  isFirstPerson = false;
  // 判断是否进入了自由漫游模式
  isFreeTravel = false;
  keyStates: { [key: string]: boolean } = {
    KeyW: false,
    KeyA: false,
    KeyS: false,
    KeyD: false,
  };
  freeClock: Three.Clock | null = null;

  static getInstance() {
    if (!this._instance) this._instance = new PhotovoltaicAnimation();
    return this._instance;
  }

  init(
    photovoltaicMeshList: {
      name: string;
      mesh: Three.Mesh;
    }[],
    photovoltaicSquarePos: {
      [name: string]: Three.Vector3;
    },
    inverterGroupArray: {
      [name: string]: Three.Group[];
    },
    curve: Three.CatmullRomCurve3
  ) {
    this.photovoltaicMeshList = photovoltaicMeshList;
    this.photovoltaicSquarePos = photovoltaicSquarePos;
    this.inverterGroupArray = inverterGroupArray;
    this.curve = curve;

    EventBus.getInstance().on("freeTravel", (val) => {
      this.isFreeTravel = val;
      this.freeClock = val ? new Three.Clock() : null;
    });
  }

  // —————————————— 光伏方阵主标签点击动画相关API ——————————————
  /**
   * @description: 点击近距离展示逆变器的动画
   * @param {string} name 每一个光伏方阵的名字，如光伏方阵1号
   * @param {number} index 每一个光伏方阵的对应下标
   * @return {*}
   */
  goClose({ name, index }: { name: string; index: number }) {
    this.photovoltaicName = name; // 记录当前方阵的名称
    this.photovoltaicIndex = index; // 记录当前方阵的序号
    this.lastEnterPos = Camera.getInstance().camera!.position.clone();
    const targetPos = [
      this.photovoltaicSquarePos[name].x,
      100,
      this.photovoltaicSquarePos[name].z,
    ] as const;
    this.tweenObj[name] = new Tween(
      Camera.getInstance().camera!.position,
      {
        x: this.photovoltaicSquarePos[name].x + 2000,
        y: 700,
        z: this.photovoltaicSquarePos[name].z + 2000,
      },
      1000
    );
    this.tweenObj[name].onStart(() => {
      Controls.getInstance().controls!.enabled = false; // 停用控制器
    });
    this.tweenObj[name].onUpdate(() => {
      Camera.getInstance().camera!.lookAt(...targetPos);
    });
    this.tweenObj[name].onComplete(() => {
      Controls.getInstance().controls!.enabled = true;
      Controls.getInstance().controls!.enableZoom = false; // 禁止缩放
      Controls.getInstance().controls!.target.set(...targetPos);
      Controls.getInstance().controls!.update();
      this.tweenObj[name] = null;
    });
  }
  // 点击返回的动画
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
      Controls.getInstance().controls!.enableZoom = true; // 禁止缩
      this.tweenObj["goBack"] = null;
    });
  }

  // —————————————— 光伏方阵进入逆变器的点击动画 ——————————————
  // 逆变器进入的漫游动画和点击事件配置
  goInverterAnimation() {
    const name = this.photovoltaicName;
    this.beforeEnterInveterPos = Camera.getInstance().camera!.position.clone();
    const targetPos = [
      this.photovoltaicSquarePos[name].x,
      150,
      this.photovoltaicSquarePos[name].z,
    ] as const;
    this.tweenObj[name] = new Tween(
      Camera.getInstance().camera!.position,
      {
        x: this.photovoltaicSquarePos[name].x,
        y: 150,
        z: this.photovoltaicSquarePos[name].z - 1850,
      },
      1000
    );
    this.tweenObj[name].onStart(() => {
      Controls.getInstance().controls!.enabled = false; // 停用控制器
      PhotovoltaicHTML.getInstance().hideOrShowMainTag(false); // 隐藏全部的主标签
    });
    this.tweenObj[name].onUpdate(() => {
      Camera.getInstance().camera!.lookAt(...targetPos);
    });
    this.tweenObj[name].onComplete(() => {
      this.inverterGroupArray[name].forEach((item) => {
        ModelClick.getInstance().addMesh(item, (group: Three.Group) => {
          // 触发事件：渲染2DHTML，展示对应逆变器的基础信息
          EventBus.getInstance().emit("inverterInfo", {
            group,
            name,
          });
        });
      });
      this.tweenObj[name] = null;
    });
  }
  // 逆变器的返回动画和配置
  goInverterAniBack() {
    // 清除所有逆变器的标签
    PhotovoltaicHTML.getInstance().removeAllInverterHTMLTag(
      this.photovoltaicName
    );
    // 移除逆变器的点击事件
    this.inverterGroupArray[this.photovoltaicName].forEach((item) => {
      ModelClick.getInstance().removeMesh(item);
    });
    // 保存一下目标位置
    const targetPos = [
      this.photovoltaicSquarePos[this.photovoltaicName].x,
      100,
      this.photovoltaicSquarePos[this.photovoltaicName].z,
    ] as const;
    // 开始动画
    this.tweenObj["goBackInverter"] = new Tween(
      Camera.getInstance().camera!.position,
      this.beforeEnterInveterPos,
      1000
    );
    this.tweenObj["goBackInverter"].onStart(() => {
      Controls.getInstance().controls!.enabled = false; // 停用控制器
    });
    this.tweenObj["goBackInverter"].onUpdate(() => {
      Camera.getInstance().camera!.lookAt(...targetPos);
    });
    this.tweenObj["goBackInverter"].onComplete(() => {
      Controls.getInstance().controls!.enabled = true;
      Controls.getInstance().controls!.target.set(...targetPos);
      Controls.getInstance().controls!.update();
      PhotovoltaicHTML.getInstance().hideOrShowMainTag(true); // 显示全部的主标签
      this.tweenObj["goBackInverter"] = null;
    });
  }

  // —————————————— 无人机巡查动画 ——————————————
  /**
   * @description: 无人机正常巡查动画 + 螺旋桨动画
   * @param {Three.Mesh} mesh 无人机模型
   * @param {Three.AnimationClip[]} animations 无人机螺旋桨旋转动画
   * @param {number} time 无人机绕其转一圈的时间
   */
  startDronePatrol(
    mesh: Three.Group,
    animations: Three.AnimationClip[],
    time = 120
  ) {
    // 如果之前没有开始过无人机巡查
    if (!this.mixer["drone"]) {
      this.droneMesh = mesh;
      const times = []; // 获取所有的时间信息
      let i = 0;
      while (i <= time) {
        times.push(i++);
      }
      // 根据生成的路径获取无人机飞行的数据点
      const pointsArr = this.curve?.getSpacedPoints(time);
      const values: number[] = [];
      pointsArr.forEach((item) => {
        values.push(item.x);
        values.push(item.y);
        values.push(item.z);
      });
      const posKF = new Three.KeyframeTrack("drone.position", times, values);
      const clip = new Three.AnimationClip("drone", time, [posKF]);
      this.mixer["drone"] = new Three.AnimationMixer(mesh);
      this.droneAction = this.mixer["drone"].clipAction(clip).play(); // 开始播放动画
      // 第一次加载运动时，也将对应的螺旋桨旋转动画加载进去
      animations.forEach((animation) => {
        this.mixer["drone"].clipAction(animation).play();
      });
      this.droneClock = new Three.Clock();
      // 将无人机添加到射线拾取的目标里面
      ModelClick.getInstance().addMesh(mesh, () => {
        // 只允许在非第一人称模式下，可以点击
        if (!this.isFirstPerson && !this.droneAction!.paused) {
          // 过渡动画，2s，切换到第一人称视角，并且所有标签不可点击
          this.patrolByFirstPerson(mesh);
          EventBus.getInstance().emit("goOrBackDroneFollow", true);
        }
      });
    }
  }
  /**
   * @description: 显示或者隐藏无人机
   * @param {boolean} isPaused 是否暂停当前的无人机巡查
   * @param {Three.Mesh} mesh 无人机模型
   * @param {Three.AnimationClip[]} animations 无人机螺旋桨旋转动画
   * @param {number} time 无人机绕其转一圈的时间
   */
  isDronePaused(
    isPaused: boolean,
    mesh: Three.Group,
    animations: Three.AnimationClip[],
    time = 120
  ) {
    this.droneMesh = mesh;
    this.startDronePatrol(mesh, animations, time);
    this.droneAction!.paused = isPaused;
  }
  // 点击无人机模型，可以靠近无人机，以第一人称视角进行巡查
  patrolByFirstPerson(mesh: Three.Group) {
    // 记录一下第一人称前的位置
    this.lastEnterPos = Camera.getInstance().camera!.position.clone();
    // 开始动画
    this.tweenObj["goDroneFollow"] = new Tween(
      Camera.getInstance().camera!.position,
      mesh.position
    );
    this.tweenObj["goDroneFollow"].onStart(() => {
      this.isFirstPerson = true;
      Controls.getInstance().controls!.enabled = false; // 停用控制器
    });
    this.tweenObj["goDroneFollow"].onUpdate(() => {
      Camera.getInstance().camera!.lookAt(mesh.position);
    });
    this.tweenObj["goDroneFollow"].onComplete(() => {
      this.tweenObj["goDroneFollow"] = null;
      // 按键按下更新状态
      window.onkeydown = (event) => {
        this.keyStates[event.code] = true;
      };
      window.onkeyup = (event) => {
        this.keyStates[event.code] = false;
      };
    });
  }
  // 第一人称下，返回动画
  backByFirstPerson() {
    // 开始动画
    this.tweenObj["backDroneFollow"] = new Tween(
      Camera.getInstance().camera!.position,
      this.lastEnterPos
    );
    this.tweenObj["backDroneFollow"].onStart(() => {
      window.onkeydown = null;
      window.onkeyup = null;
    });
    this.tweenObj["backDroneFollow"].onUpdate(() => {
      Camera.getInstance().camera!.lookAt(0, 0, 0);
    });
    this.tweenObj["backDroneFollow"].onComplete(() => {
      this.isFirstPerson = false;
      this.tweenObj["backDroneFollow"] = null;
      PhotovoltaicHTML.getInstance().hideOrShowMainTag(true);
      Controls.getInstance().controls!.target.set(0, 0, 0);
      Controls.getInstance().controls!.update();
      Controls.getInstance().controls!.enabled = true;
    });
  }
  // 第一人称模式下的自由漫游动画
  freeTravel(time: number) {
    const up = new Three.Vector3(0, 1, 0); // 高度方向，默认是 Y 方向
    const speed = 1000; // 默认漫游速度
    const v = new Three.Vector3(); // 用于计算当前按键状态下的速度
    const cameraDir = new Three.Vector3(); // 获取当前的摄像机视角
    Camera.getInstance().camera!.getWorldDirection(cameraDir);
    cameraDir.y = 0; // 保证只在XOZ平面上运动，不往上或下跑
    cameraDir.normalize(); // 归一化，让其在X和Z分量上的数据正常化(Y归0了)
    // 前后运动
    if (this.keyStates.KeyW) {
      v.add(cameraDir.clone().multiplyScalar(speed)); // 运动方向是Z轴正方向，按下W
    } else if (this.keyStates.KeyS) {
      v.add(cameraDir.clone().multiplyScalar(-speed)); // 运动方向是Z轴正方向，按下W
    }
    // 左右运动
    if (this.keyStates.KeyA) {
      const left = up.clone().cross(cameraDir); // 叉乘计算方向
      v.add(left.multiplyScalar(speed));
    } else if (this.keyStates.KeyD) {
      const right = cameraDir.clone().cross(up);
      v.add(right.multiplyScalar(speed));
    }
    v.multiplyScalar(time); // 计算当前速度跑了多长距离
    Camera.getInstance().camera!.position.add(v);
  }

  // —————————————— 光伏方阵工况点击动画 ——————————————
  clickWorkCondition(pos: [number, number, number]) {
    const dis = 800;
    const xFlag = Camera.getInstance().camera!.position.x > pos[0] ? 1 : -1;
    const zFlag = Camera.getInstance().camera!.position.z > pos[2] ? 1 : -1;
    this.tweenObj["clickWorkCondition"] = new Tween(
      Camera.getInstance().camera!.position,
      {
        x: pos[0] + xFlag * dis,
        y: pos[1] + 250,
        z: pos[2] + zFlag * dis,
      },
      1000
    );
    this.tweenObj["clickWorkCondition"].onStart(() => {
      Controls.getInstance().controls!.enabled = false;
    });
    this.tweenObj["clickWorkCondition"].onUpdate(() => {
      Camera.getInstance().camera!.lookAt(...pos);
    });
    this.tweenObj["clickWorkCondition"].onComplete(() => {
      this.tweenObj["clickWorkCondition"] = null;
      Controls.getInstance().controls!.target.set(...pos);
      Controls.getInstance().controls!.update();
      Controls.getInstance().controls!.enabled = true;
    });
  }

  // —————————————— tween动画库的更新方法 以及 无人机关于摄像机的更新 ——————————————
  loop() {
    for (let key in this.tweenObj) {
      if (this.tweenObj[key]) this.tweenObj[key].update();
    }
    this.mixer["drone"]?.update(this.droneClock!.getDelta());
    // 只有在第一人称模式下，且动画已经完成后(并且没有触发返回模式)，摄像机视角始终指向地面，且跟随无人机移动
    if (
      this.isFirstPerson &&
      !this.tweenObj["goDroneFollow"] &&
      !this.tweenObj["backDroneFollow"] &&
      !this.isFreeTravel
    ) {
      Camera.getInstance().camera!.position.set(
        this.droneMesh!.position.x,
        this.droneMesh!.position.y - 50,
        this.droneMesh!.position.z
      );
      Camera.getInstance().camera!.lookAt(
        this.droneMesh!.position.x,
        0,
        this.droneMesh!.position.z
      );
    }
    // 如果进入了第一人称自由漫游模式
    if (this.isFreeTravel) {
      this.freeTravel(this.freeClock!.getDelta());
    }
  }
}
