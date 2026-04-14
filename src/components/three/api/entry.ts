/*
 * @Description: 入口文件
 * @Author: caocong “caocong@hopewind.com”
 * @Date: 2024-11-19 16:29:24
 * @LastEditors: caocong “caocong@hopewind.com”
 * @LastEditTime: 2025-02-28 14:15:48
 * @FilePath: \digital_twins2\src\components\three\api\entry.ts
 * Copyright 2024 Shenzhen Hopewind Electric Co., Ltd, All Rights Reserved.
 */
import * as Three from "three";
import { CSS2DRenderer } from "three/addons/renderers/CSS2DRenderer.js";
import { CSS3DRenderer } from "three/addons/renderers/CSS3DRenderer.js";
import EventBus from "@/utils/eventBus";
import Camera from "./camera";
import Scene from "./scene";
import Light from "./light";
import Controls from "./control";
import ModelClick from "./modelClick";
import Weather from "./weather";
import Sea from "./Sea";
import SeaSky from "./Sky";
import Renderer from "./renderer";
import Wind from "../windModel/wind";
import Mountain from "../windModel/mountain";
import WindAnimation from "../windModel/windUtils/windAnimation";
import EnergyFlow from "../windModel/windUtils/energyFlow";
import PhotovoltaicAnimation from "../photovoltaicModel/photovoltaicUtils/photovoltaicAnimation";
import Station from "../windModel/station";
import RipperReminder from "./rippleReminder";
import CommonAnimation from "./commonAnimation";
import PhotovoltaicAll from "../photovoltaicModel/photovoltaicAll";
import FloorMountain from "../photovoltaicModel/floorMountain";
import EleNetwork from "../photovoltaicModel/eleNetwork";
import DronePath from "../photovoltaicModel/photovoltaicUtils/dronePath";
import TechStyleModel from "../techStyleModel/index";
import { useSettingStore } from "@/store/setting";
import { useDebounceFn } from "@vueuse/core";
import Stats from "three/addons/libs/stats.module.js";
import PostProcess from "./postProcess";
import globalLayer from "@/config/layerConfig";
import Galaxy from "../techStyleModel/galaxy";

export default function entry(container: HTMLElement) {
  // 初始化场景
  const scene = Scene.getInstance().init(container);
  // 初始化相机
  const camera = Camera.getInstance().init(container);
  // 初始化灯光
  Light.getInstance();
  // 初始化WebGL渲染器
  const x = container.clientWidth;
  const y = container.clientHeight;
  const renderer = Renderer.getInstance().init(container);
  renderer.setSize(x, y);
  container.appendChild(renderer.domElement);
  const { composer, finalComposer } = PostProcess.getInstance().init(container);
  // 初始化控制器
  const controls = Controls.getInstance().init(camera, renderer.domElement);
  // 初始化射线拾取
  ModelClick.getInstance().init(camera, container, renderer.domElement);
  // 初始化需要的数据，后续这块应该挪到对应的vue文件中，根据接口获取
  const mainWindInfo = ref([
    {
      status: 1,
      intro: "风机简洁介绍",
    },
    {
      status: 0,
      intro: "风机简洁介绍",
    },
    {
      status: 1,
      intro: "风机简洁介绍",
    },
    {
      status: 2,
      intro: "风机简洁介绍",
    },
    {
      status: 0,
      intro: "风机简洁介绍",
    },
    {
      status: 2,
      intro: "风机简洁介绍",
    },
    {
      status: 0,
      intro: "风机简洁介绍",
    },
    {
      status: 1,
      intro: "风机简洁介绍",
    },
    {
      status: 0,
      intro: "风机简洁介绍",
    },
  ]);
  const mainPhotovoltaicInfo = ref([
    {
      status: 1,
      position: [[1, 1]],
      type: ["fire"],
    },
    {
      status: 0,
      position: [[1, 7]],
      type: ["smoke"],
    },
    {
      status: 2,
      position: [[7, 7]],
      type: ["smoke"],
    },
    {
      status: 0,
      position: [[4, 4]],
      type: ["fire"],
    },
    {
      status: 2,
      position: [[7, 1]],
      type: ["smoke"],
    },
    {
      status: 0,
      position: [
        [2, 3],
        [6, 2],
      ],
      type: ["fire", "smoke"],
    },
    {
      status: 1,
      position: [
        [3, 7],
        [4, 5],
      ],
      type: ["smoke", "fire"],
    },
    {
      status: 0,
      position: [
        [2, 6],
        [2, 7],
      ],
      type: ["fire", "smoke"],
    },
  ]);

  // —————————————————————— 初始化用户设置 ——————————————————————
  const setting = useSettingStore();
  CommonAnimation.getInstance().init(setting.radius, setting.isAutoInspect);

  // —————————————————————— CSS2DHTML渲染器 ——————————————————————
  const css2Renderer = new CSS2DRenderer();
  css2Renderer.domElement.style.position = "absolute"; // 将css2D与canvas画布重合
  css2Renderer.domElement.style.top = "0";
  css2Renderer.domElement.style.pointerEvents = "none"; // 禁止css2D渲染器的点击，从而可以点击到canvas画布
  css2Renderer.domElement.style.overflow = "visible"; // 解决3D/2D渲染后HTML标签不出现的问题
  const css3Renderer = new CSS3DRenderer();
  css3Renderer.domElement.style.position = "absolute"; // 将css2D与canvas画布重合
  css3Renderer.domElement.style.top = "0";
  css3Renderer.domElement.style.pointerEvents = "none"; // 禁止css2D渲染器的点击，从而可以点击到canvas画布
  css3Renderer.domElement.style.overflow = "visible"; // 解决3D/2D渲染后HTML标签不出现的问题
  // 初始化渲染器大小，并添加进容器
  css2Renderer.setSize(x, y);
  css3Renderer.setSize(x, y);
  container.appendChild(css2Renderer.domElement);
  container.appendChild(css3Renderer.domElement);

  // 创建stats对象
  const stats = new Stats();
  document.body.appendChild(stats.dom);

  // —————————————————————— 天气的事件处理 ——————————————————————
  Weather.getInstance().init(scene, Light.getInstance().light); // 初始化天气系统

  // ——————————————————————  屏幕大小改变重新渲染画布和CSS2D/3D ——————————————————————
  const resizeHandle = () => {
    renderer.setSize(container.clientWidth, container.clientHeight);
    css2Renderer.setSize(container.clientWidth, container.clientHeight);
    css3Renderer.setSize(container.clientWidth, container.clientHeight);
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix(); // 更新一下相机，跟随变化
  };
  // 加个节流
  const throttle = useDebounceFn(resizeHandle, 50, { maxWait: 500 });
  // 使用观察器，监听DOM大小的变化
  const resizeObserver = new ResizeObserver(throttle);
  resizeObserver.observe(container);

  // —————————————————————— 模型加载 ——————————————————————
  let type: "wind" | "photovoltaic" | "tech";
  let energyFlow: EnergyFlow;
  // 这块根据路由来区分光伏和风电
  EventBus.getInstance().on("windModel", () => {
    type = "wind";
    // 初始化海洋和天空
    SeaSky.getInstance();
    Sea.getInstance();
    // 初始化山地场景
    new Mountain();
    // 加载升压器
    new Station([-3000, 100, 6000]);
    // 加载风电场景模型
    const wind = new Wind(mainWindInfo);
    // 初始化能量流图
    energyFlow = new EnergyFlow(wind.clonePos, [-3000, 0, 6000]);
    energyFlow.init();
  });
  EventBus.getInstance().on("photovoltaicModel", () => {
    type = "photovoltaic";
    // 初始化天空
    SeaSky.getInstance();
    new PhotovoltaicAll(mainPhotovoltaicInfo);
    new FloorMountain();
    new EleNetwork();
    // 添加聚光灯，让光伏主体更亮一些
    const spotLight = Light.getInstance().addLight(
      "SpotLight",
      "光伏聚光",
      5,
      0xffffff,
      [0, 10000, 0]
    );
    spotLight.decay = 0.1; // 设置光源随距离衰减的比例
    spotLight.castShadow = false; // 聚光不产生阴影
    spotLight.target.position.set(0, 0, 0);
    scene.add(spotLight, spotLight.target);
  });
  EventBus.getInstance().on("techStyleModel", () => {
    type = "tech";
    new TechStyleModel();
    Scene.getInstance().createTechFloor(); // 加载科技风地面
  });

  const bloomLayer = new Three.Layers(); // 光晕层次-创建一个图层对象
  bloomLayer.set(globalLayer.processLayer); // 先把光晕层次设置光晕场景的层次1
  const darkMaterial = new Three.MeshBasicMaterial({ color: "black" }); // 跟辉光光晕有关的变量
  const materials: any = {}; // 跟辉光光晕有关的变量
  function darkenNonBloomed(obj: any) {
    if (obj instanceof Three.Scene) {
      // 此处忽略Scene，否则场景背景会被影响
      materials.scene = obj.background;
      obj.background = null;
      return;
    }
    if (
      obj.isMesh &&
      bloomLayer.test(obj.layers) === false // 判断与辉光是否同层
    ) {
      materials[obj.uuid] = obj.material;
      obj.material = darkMaterial;
    }
  }
  function restoreMaterial(obj: any) {
    if (obj instanceof Three.Scene) {
      obj.background = materials.scene;
      delete materials.scene;
      return;
    }
    if (materials[obj.uuid]) {
      obj.material = materials[obj.uuid];
      delete materials[obj.uuid];
    }
  }

  // —————————————————————— 将不同模式下的循环进行切分 ——————————————————————
  const commonLoop = () => {
    stats.update();
    css2Renderer.render(scene, camera);
    css3Renderer.render(scene, camera);
    CommonAnimation.getInstance().loop();
  };
  // 风电循环
  const windLoop = () => {
    renderer.render(scene, camera);
    Sea.getInstance().loop();
    WindAnimation.getInstance().loop();
    energyFlow?.loop();
    RipperReminder.getInstance().loop();
  };
  // 光伏循环
  const photovoltaicLoop = () => {
    renderer.render(scene, camera);
    PhotovoltaicAnimation.getInstance().loop();
    DronePath.getInstance().loop(); // 无人机巡查路径
    RipperReminder.getInstance().loop();
  };
  // 科技风循环
  const techLoop = () => {
    scene.traverse(darkenNonBloomed); // 隐藏不需要辉光的物体
    composer.render();
    scene.traverse(restoreMaterial); // 还原
    finalComposer.render();
    Galaxy.getInstance().loop();
  };
  // 将对应的loop进行保存
  const loop = {
    windLoop,
    photovoltaicLoop,
    techLoop,
  };
  // main是主循环，一个是渲染场景，一个是渲染动画，一个是渲染标签
  let mainTimer = 0;
  const main = () => {
    commonLoop();
    type && loop[`${type}Loop`]();
    mainTimer = requestAnimationFrame(main);
  };
  main();

  // 销毁需要销毁的组件 （感觉还是没有销毁干净）
  function clearAll() {
    cancelAnimationFrame(mainTimer); // 取消请求帧
    Scene.getInstance().clearAll(); // 清空所有的模型
    // 环境光和平行光没有dispose方法
    Light.getInstance().clearAll();
    controls.dispose(); // 控制器注销
    Weather.getInstance().clearAll();
    RipperReminder.getInstance().clearAll();
    energyFlow?.clearAll();
  }
  return clearAll;
}
