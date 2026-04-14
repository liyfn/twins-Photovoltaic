/*
 * @Description: 风机场景加载
 * @Author: caocong “caocong@hopewind.com”
 * @Date: 2024-11-28 19:43:55
 * @LastEditors: caocong “caocong@hopewind.com”
 * @LastEditTime: 2025-03-05 14:45:49
 * @FilePath: \digital_twins2\src\components\three\windModel\wind.ts
 * Copyright 2024 Shenzhen Hopewind Electric Co., Ltd, All Rights Reserved.
 */
import * as Three from "three";
import modelLoader from "../api/modelLoad";
import EventBus from "@/utils/eventBus";
import Scene from "../api/scene";
import { clone } from "three/addons/utils/SkeletonUtils.js";
import WindHTML from "./windUtils/windHTML";
import WindAnimation from "./windUtils/windAnimation";
import RipperReminder from "../api/rippleReminder";
import Camera from "../api/camera";
import globalLayer from "@/config/layerConfig";
import Sea from "../api/Sea";

export default class Wind {
  windMeshList: {
    name: string;
    mesh: Three.Mesh;
  }[] = []; // 存储整体风机的模型
  boomAniArray: Three.AnimationClip[] = []; // 存储爆炸动画的切片数组
  bladeAniArray: Three.AnimationClip[] = []; // 存储风机扇叶旋转动画的切片数组
  partsMeshArray: {
    [name: string]: Three.Mesh[];
  } = {}; // 存储风机爆炸动画零部件的Mesh和名称
  nameArray: string[] = [
    "Object_46",
    "Object_34",
    "Object_85",
    "Object_88",
    "Object_64",
    "Object_91",
    "Object_67",
    "Object_73",
  ]; // 存储可以点击的模型零部件名称
  cloneCount: number = 9; // 风机克隆的数量
  // 风机克隆的位置  TODO：做成固定的按照几行几列的方式排布，可以自定义克隆数量，以及自定义位置、旋转角度、名称？、转速
  clonePos: number[][] = [
    [-12000, 0, 1000],
    [-10000, 0, -10000],
    [-5000, 0, 0],
    [-6000, 0, 3000],
    [5000, 0, 7000],
    [5000, 0, 0],
    [0, 0, -5000],
    [0, 0, 0],
    [0, 0, 5000],
  ];
  cloneRotation: number[] = [0, 0.5, -1, -0.8, 0.5, 0.4, -0.3, 0, -0.7]; // 克隆风机的旋转角度
  cameraBoomPos: number[][] = []; // 记录摄像机应该在的位置
  cameraClosePos: number[][] = []; // 记录摄像机应该在的位置
  // 传递的数据
  information: { [name: string]: any } = {
    Object_46: {
      name: "散热器",
      status: "正常",
    },
    Object_34: {
      name: "电机",
      status: "正常",
    },
    Object_85: {
      name: "离合器",
      status: "正常",
    },
    Object_88: {
      name: "制动盘",
      status: "正常",
    },
    Object_64: {
      name: "齿轮箱",
      status: "正常",
    },
    Object_91: {
      name: "主轴",
      status: "正常",
    },
    Object_67: {
      name: "轴承",
      status: "正常",
    },
    Object_73: {
      name: "轮毂",
      status: "正常",
    },
  };

  singalLayer = new Three.Layers();

  constructor(data: any) {
    this.cameraPosCal();
    this.init(data);
    this.addEventListen();
    this.singalLayer.set(globalLayer.signalLayer);
  }

  init(data: any) {
    modelLoader("/风机_hopeview_animation.glb", (glb) => {
      // 存储除了风机旋转动画以外的风机零部件动画
      this.boomAniArray = glb.animations.filter(
        (item: Three.AnimationClip) =>
          item.name !== "Object_76Action" &&
          item.name !== "Object_79Action" &&
          item.name !== "Object_31Action"
      );

      // 修改零部件的材质
      glb.scene.traverse((obj: any) => {
        if (obj.isMesh) {
          obj.castShadow = true;
          // TODO：这里的材质应该是UV纹理的问题，后续可以研究一下
          obj.material.roughness = 0.25; // 默认材质导出会出问题，不受环境光影响，这里改变材质参数
          obj.material.metalness = 0.7;
          obj.material.color = new Three.Color(0.52, 0.52, 0.52);
        }
      });
      // 克隆风机
      this.cloneWind(glb, data);

      // 初始化事件动画API和HTML的API需要的数据
      WindHTML.getInstance().init(this.partsMeshArray);
      WindAnimation.getInstance().init(
        this.windMeshList,
        this.boomAniArray,
        this.partsMeshArray,
        this.cameraClosePos,
        this.cameraBoomPos,
        this.clonePos
      );

      // 风机模型加载完毕之后，触发入场动画，true表示开始，false表示结束
      EventBus.getInstance().emit("entryAnimationOrEnd", {
        isStart: true,
        endPos: [6000, 1500, 0],
        time: 2000,
      });
    });
  }

  // 风机克隆
  cloneWind(glb: any, data: any) {
    const allMesh: Array<Three.Mesh> = [];
    for (let i = 0; i < this.cloneCount; i++) {
      const mesh = clone(glb.scene); // 不太清楚这个clone方法和普通的克隆有什么区别
      allMesh.push(mesh as Three.Mesh);
      allMesh[i].name = `风机${i + 1}号`; // 默认名称可以叫这个，看怎么改成支持用户自定义风机名称
      allMesh[i].position.set(
        this.clonePos[i][0],
        this.clonePos[i][1],
        this.clonePos[i][2]
      );
      allMesh[i].scale.set(8.5, 8.5, 8.5);
      allMesh[i].rotation.set(0, this.cloneRotation[i], 0);
      this.windMeshList.push({
        name: `风机${i + 1}号`,
        mesh: allMesh[i],
      });
      // 添加到mesh中
      Scene.getInstance().addMesh(allMesh[i]);
      if (!this.bladeAniArray.length) {
        // 风机扇叶转动动画存储位置
        this.bladeAniArray.push(glb.animations[0]);
        this.bladeAniArray.push(glb.animations[6]);
        this.bladeAniArray.push(glb.animations[7]);
      }
      // 为每一个风机都献上旋转动画
      WindAnimation.getInstance().bladeRotate(
        allMesh[i],
        this.bladeAniArray,
        "blade" + i // 为每一组风机的旋转添加不同的名字，便于后续区分
        // 1.5 + (-1 ^ i) / 10 // 让每个风机的转速不同
      );

      // 触发事件，给每一个风机加上对应的HTML标签
      EventBus.getInstance().emit("addMainTag", {
        mesh: allMesh[i],
        name: `风机${i + 1}号`,
        index: i,
        data,
        HTML: "windTurbine",
      });

      // 初始化每一个风机单独的零部件数组
      if (!this.partsMeshArray[`风机${i + 1}号`])
        this.partsMeshArray[`风机${i + 1}号`] = [];
      allMesh[i].traverse((obj: any) => {
        if (obj.isMesh) {
          if (this.nameArray.includes(obj.name)) {
            this.partsMeshArray[`风机${i + 1}号`].push(obj);
          }
        }
      });
    }
  }

  // 添加事件监听
  addEventListen() {
    // 风机主标签添加事件监听
    EventBus.getInstance().on(
      "addMainTag",
      ({ mesh, name, index, data, HTML }) => {
        WindHTML.getInstance().addMainTag(mesh, name, index, data, HTML);
      }
    );
    // 点击事件触发，动画开始，移动到其附近，目标指向mesh的位置  返回事件，控制器解除限制
    EventBus.getInstance().on(
      "goWindCloseOrBack",
      ({ isClose, name, index }) => {
        isClose
          ? WindAnimation.getInstance().goClose({ name, index })
          : WindAnimation.getInstance().goBack();
      }
    );
    // 风机爆炸图事件监听
    let mesh: any; // 用于控制记录当前独立出去的模型
    EventBus.getInstance().on("boomAniOrBack", ({ isStart, name, index }) => {
      if (isStart) {
        WindAnimation.getInstance().boomAnimation({ name, index });
        mesh = this.windMeshList[index].mesh;
        mesh.traverse((child: any) => {
          if (child.isMesh) child.layers.set(globalLayer.signalLayer);
        });
        Camera.getInstance().camera?.layers.set(globalLayer.signalLayer);
        Sea.getInstance().water?.layers.set(globalLayer.signalLayer);
        // 将本层以外的模型全部不可见，这样就不会出现倒影
        Scene.getInstance().scene.traverse((child: any) => {
          if (child.isMesh && !child.layers.test(this.singalLayer)) {
            child.visible = false;
          }
        });
      } else {
        WindAnimation.getInstance().boomAnimationBack();
        mesh.traverse((child: any) => {
          if (child.isMesh) child.layers.set(globalLayer.defaultLayer);
        });
        Camera.getInstance().camera?.layers.set(globalLayer.defaultLayer);
        Sea.getInstance().water?.layers.set(globalLayer.defaultLayer);
        Scene.getInstance().addMesh(mesh);
        setTimeout(() => {
          Scene.getInstance().scene.traverse((child: any) => {
            if (child.isMesh && !child.layers.test(this.singalLayer)) {
              child.visible = true;
            }
          });
        }, 2000);
      }
    });
    // 监听事件：渲染2DHTML，展示对应零部件的基础信息
    EventBus.getInstance().on("partsInfo", ({ mesh, name }) => {
      WindHTML.getInstance().addPartsHTMLTag(
        mesh,
        this.information[mesh.name],
        name
      );
    });
    // 监听事件：添加模型底部波纹提示
    EventBus.getInstance().on(
      "addDiffusion",
      ({ name, color, index }) => {
        RipperReminder.getInstance().addDiffusion(
          name,
          color,
          this.clonePos[index]
        );
      }
    );
    // 监听事件：移除模型底部波纹提示
    EventBus.getInstance().on("removeDiffusion", ({ name }) => {
      RipperReminder.getInstance().removeDiffusion(name);
    });
    // 监听事件：显示或者隐藏风机的主标签
    EventBus.getInstance().on("HideOrShowMainTag", (isHideAllTag) => {
      WindHTML.getInstance().hideOrShowMainTag(isHideAllTag);
    });
    // 监听事件：风速改变时改变风机旋转速度
    EventBus.getInstance().on("changeWindSpeed", (speed: number) => {
      WindAnimation.getInstance().changeBladeSpeed(speed);
    });
  }

  // 计算查看风机以及爆炸图时的摄像机位置
  cameraPosCal() {
    for (let i = 0; i < this.cloneCount; i++) {
      let x = this.clonePos[i][0];
      let y = this.clonePos[i][1];
      let z = this.clonePos[i][2];
      this.cameraBoomPos.push([]);
      this.cameraClosePos.push([]);
      let a1 = x + 200 * Math.cos(this.cloneRotation[i]);
      let b1 = y + 675;
      let c1 = z - 200 * Math.sin(this.cloneRotation[i]);
      let a2 = x + 1000 * Math.cos(this.cloneRotation[i]);
      let b2 = y + 800;
      let c2 = z - 1000 * Math.sin(this.cloneRotation[i]);
      this.cameraBoomPos[i] = [a1, b1, c1]; // 爆炸图时的摄像机位置
      this.cameraClosePos[i] = [a2, b2, c2]; // 靠近风机时的摄像机位置
    }
  }
}
