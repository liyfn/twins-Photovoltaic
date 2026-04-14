import * as Three from "three";
import Rain from "@/assets/svg/ic_rain_drop.svg";
import Snow from "@/assets/svg/snowflake-2.svg";
// import Smoke from "@/assets/img/cloud.png";
import EventBus from "@/utils/eventBus";
import { Clouds } from "@pmndrs/vanilla"; // , Cloud
import Camera from "./camera";
// import Gui from "./gui";

export default class Weather {
  private static _instance: Weather | undefined = undefined;
  scene: Three.Scene = new Three.Scene(); // 场景用于增加或删除对应的天气情况
  meshList: (Three.Mesh | Three.Group)[] = []; // 记录目前的模型
  light: Three.Light[] = []; // 不同的天气，光照强度也不同
  initAmbientIntensity = 0; // 记录环境光的初始强度
  initDirectionIntensity = 0; // 记录太阳光的初始强度
  ambientIntensity = 0; // 记录环境光的当前天气下的强度
  directionIntensity = 0; // 记录太阳光的当前天气下的强度

  rainTexture: Three.Texture | undefined; // 雨的纹理
  rainMaterial: Three.PointsMaterial | undefined; // 雨的材质
  rainGroup: Three.Group = new Three.Group(); // 用于放置雨的组
  isRained = false; // 判断是否已经执行过相应的初始化语句
  snowTexture: Three.Texture | undefined;
  snowMaterial: Three.PointsMaterial | undefined;
  snowGroup: Three.Group = new Three.Group();
  isSnowed = false;
  smokeTexture!: Three.Texture;
  clouds!: Clouds; // 雾的实例
  isClouds = false; // 判断是否已经初始化过大雾
  lastCameraPos = new Three.Vector3(); // 用于记录摄像机的位置是否发生变化
  clock: Three.Clock | null = null; // 用于表示烟雾的更新时间

  requestTimer: {
    [key: string]: number;
  } = {};
  isWinding = false; // 判断当前是否处于大风天气
  isNormal = true; // 判断当前是否是默认的状态

  static getInstance() {
    if (!this._instance) this._instance = new Weather();
    return this._instance;
  }
  // 初始化天气相关
  init(scene: Three.Scene, light: Three.Light[]) {
    this.scene = scene;
    this.light = light;

    this.light.forEach((item) => {
      if (item.name === "环境光")
        this.initAmbientIntensity = this.ambientIntensity = item.intensity;
      else if (item.name === "太阳光")
        this.initDirectionIntensity = this.directionIntensity = item.intensity;
    });
    this.addEvent();

    this.meshList.push(this.rainGroup);
    this.meshList.push(this.snowGroup);
  }

  // 初始化相应的天气材质
  initRAS(type: "snow" | "rain") {
    const textureUrl = type === "rain" ? Rain : Snow;
    this[`${type}Texture`] = new Three.TextureLoader().load(textureUrl);
    this[`${type}Material`] = new Three.PointsMaterial({
      size: 50,
      transparent: true,
      map: this[`${type}Texture`],
      depthTest: true,
      depthWrite: false, // 解决粒子显示正常的透明效果以及前后叠加时出现的层级问题
    });
    this[`${type}Group`].name = `${type}_group`;
  }

  /**
   * @description: 模拟下雨天气
   * @param {number} ambientIntensity 环境光强度
   * @param {number} directionIntensity 太阳光强度
   * @param {*} rainIntensity 雨水强度
   * @param {*} speed 下雨速度
   */
  rain(
    ambientIntensity = 0.4,
    directionIntensity = 1,
    rainIntensity = 2,
    speed = 2
  ) {
    // 先切回到初始状态，再切换到对应状态
    this.normal(ambientIntensity, directionIntensity);
    this.isNormal = false;
    // 如果是第一次，需要建立对应的模型
    if (!this.isRained) {
      this.initRAS("rain");
      this.generateRAS("rain", rainIntensity);
      this.isRained = true;
    }
    this.scene.add(this.rainGroup);
    this.loop(this.rainGroup, { speed });
  }

  /**
   * @description: 模拟下雪天气
   * @param {number} ambientIntensity 环境光强度
   * @param {number} directionIntensity 太阳光强度
   * @param {*} snowIntensity 雪花强度
   * @param {*} speed 下雪速度
   */
  snow(
    ambientIntensity = 0.6,
    directionIntensity = 2,
    snowIntensity = 2,
    speed = 2
  ) {
    // 先切回到初始状态，再切换到对应状态
    this.normal(ambientIntensity, directionIntensity);
    this.isNormal = false;
    // 如果是第一次，需要建立对应的模型
    if (!this.isSnowed) {
      this.initRAS("snow");
      this.generateRAS("snow", snowIntensity);
      this.isSnowed = true;
    }
    this.scene.add(this.snowGroup);
    this.loop(this.snowGroup, { speed });
  }

  // 生成雨雪天气的粒子系统
  generateRAS(type: "rain" | "snow", intensity: number) {
    const geo = new Three.BufferGeometry();
    const positions: number[] = [];
    const range = 30000;
    const randomScale: number[] = [];
    for (let i = 0; i < intensity * 1000; i++) {
      const particle = [
        (Math.random() - 0.5) * range,
        Math.random() * 12000,
        (Math.random() - 0.5) * range,
      ];
      positions.push(...particle);
      randomScale.push(Math.random() + 0.5);
    }
    geo.attributes.position = new Three.BufferAttribute(
      new Float32Array(positions),
      3
    );
    geo.attributes.zIndex = new Three.BufferAttribute(
      new Float32Array(randomScale),
      1
    );
    const mesh = new Three.Points(geo, this[`${type}Material`]);
    // 使得每一个大小都不一样
    this[`${type}Material`]!.onBeforeCompile = (shader) => {
      shader.vertexShader = shader.vertexShader.replace(
        "void main() {",
        `
        attribute float zIndex;
        void main() {
        `
      );
      shader.vertexShader = shader.vertexShader.replace(
        "#include <fog_vertex>",
        `
        #include <fog_vertex>
        gl_PointSize *= zIndex;
        `
      );
    };
    mesh.position.y = -100;
    this[`${type}Group`].add(mesh);
  }

  // 大雾天气，光照最好不要变化，雾会跟随摄像机的位置移动
  // TODO：目前烟雾效果不是很好，后续再改进
  // 可能的方向：拉近后烟雾散去，拉远有些朦胧的感觉(感觉这个就可以用Scene的Fog去实现)
  smoke(ambientIntensity = 0.4, directionIntensity = 1.5) {
    this.normal(ambientIntensity, directionIntensity);
    this.isNormal = false;
    // if (!this.isClouds) {
    //   this.isClouds = true;
    //   this.smokeTexture = new Three.TextureLoader().load(Smoke);
    //   this.clouds = new Clouds({
    //     texture: this.smokeTexture,
    //     material: Three.MeshBasicMaterial, // 不受光照的影响
    //   });
    //   this.clouds.name = "大雾";
    //   this.meshList.push(this.clouds);
    //   const cloud = new Cloud({
    //     seed: 72,
    //     bounds: new Three.Vector3(5, 1, 5),
    //     segments: 50,
    //     volume: 1.2,
    //     opacity: 0.8,
    //     concentrate: "random",
    //   });
    //   this.clouds.add(cloud);
    //   this.clouds.scale.set(1000, 1000, 1000);
    //   // const folder = Gui.getInstance().addFolder("雾");
    //   // folder.add(cloud, "opacity", 0, 1, 0.1).onChange(() => {
    //   //   cloud.updateCloud();
    //   // });
    //   // folder.add(cloud, "seed", 0, 100, 1).onChange(() => {
    //   //   cloud.updateCloud();
    //   // });
    //   // folder.add(cloud, "speed", 0, 2).onChange(() => {
    //   //   cloud.updateCloud();
    //   // });
    //   // folder.add(cloud, "segments", 0, 100, 10).onChange(() => {
    //   //   cloud.updateCloud();
    //   // });
    //   // folder.add(cloud, "volume", 0, 8).onChange(() => {
    //   //   cloud.updateCloud();
    //   // });
    // }
    // this.lastCameraPos = Camera.getInstance().camera.position.clone();
    // this.clouds.position.copy(Camera.getInstance().camera.position.clone());
    // this.scene.add(this.clouds);
    // this.clock = new Three.Clock();
    // this.loop(this.clouds, { clock: this.clock });
  }

  // 阴天天气：降低光照强度
  overcast(ambientIntensity = 0.4, directionIntensity = 1.5) {
    this.normal(ambientIntensity, directionIntensity);
    this.isNormal = false;
  }

  // 回到初始状态或者跳转到其他状态
  normal(ambientIntensity?: number, directionIntensity?: number) {
    this.isNormal = true;
    this.clearLoop(); // 循环暂停
    // 回到当前情况下的默认灯光强度
    this.ambientIntensity = ambientIntensity ?? this.initAmbientIntensity;
    this.directionIntensity = directionIntensity ?? this.initDirectionIntensity;
    this.changeLight();
  }

  // 改变灯光强度，结合了当前时间下的灯光强度以及当前天气下的灯光强度
  changeLight() {
    this.light.forEach((item) => {
      if (item.name === "环境光")
        item.intensity =
          this.initAmbientIntensity * 0.2 + this.ambientIntensity * 0.8;
      else if (item.name === "太阳光")
        item.intensity =
          this.initDirectionIntensity * 0.2 + this.directionIntensity * 0.8;
    });
  }
  // 事件循环
  loop(group: Three.Group, obj: { speed?: number; clock?: Three.Clock }) {
    if (!obj.speed) {
      if (!this.lastCameraPos.equals(Camera.getInstance().camera.position)) {
        this.lastCameraPos = Camera.getInstance().camera.position.clone();
        this.clouds.position.copy(Camera.getInstance().camera.position.clone());
      }
      this.clouds.update(
        Camera.getInstance().camera,
        obj.clock!.getElapsedTime(),
        obj.clock!.getDelta()
      );
    } else {
      const mesh = group.children[0] as Three.Mesh;
      const pos = mesh.geometry.getAttribute("position").array;
      for (let i = 0; i < pos.length; i += 3) {
        pos[i + 1] -= 10 * obj.speed;
        if (pos[i + 1] < -100) pos[i + 1] = 12000;
      }
      mesh.geometry.attributes.position.needsUpdate = true;
    }
    this.requestTimer[group.name] = requestAnimationFrame(() => {
      this.loop(group, obj);
    });
  }

  // 清空事件循环和将天气模型从场景中移除
  clearLoop() {
    this.meshList.forEach((item) => {
      this.scene.remove(item);
    });
    for (let name in this.requestTimer) {
      cancelAnimationFrame(this.requestTimer[name]);
    }
    if (this.clock) this.clock = null;
  }
  // 清空全部
  clearAll() {
    this.clearLoop();
    this.rainTexture?.dispose();
    this.snowTexture?.dispose();
    this.smokeTexture?.dispose();
  }

  addEvent() {
    // 点击对应的天气按钮，会执行对应的方法
    EventBus.getInstance().on("clickWeather", (name: string) => {
      switch (name) {
        case "rain":
          this.rain();
          break;
        case "snow":
          this.snow();
          break;
        case "smoke":
          this.smoke();
          break;
        // case "wind":
        //   this.wind();
        //   break;
        case "overcast":
          this.overcast();
          break;
        case "normal":
          this.normal();
          break;
        default:
          this.normal();
          break;
      }
    });
    // 点击时间系统的按钮，会改变当前的光照强度
    EventBus.getInstance().on("clickTimeSys", () => {
      // 需要保存一下对应时间的默认的光照强度
      this.light.forEach((item) => {
        if (item.name === "环境光") this.initAmbientIntensity = item.intensity;
        else if (item.name === "太阳光")
          this.initDirectionIntensity = item.intensity;
      });
      // 此时需要在改变一次灯光的强度
      // 这里是因为在当前是默认天气的情况下的，不会执行下面这段语句，因此需要手动执行一遍
      if (this.isNormal) {
        this.ambientIntensity = this.initAmbientIntensity;
        this.directionIntensity = this.initDirectionIntensity;
      }
      this.changeLight();
    });
  }
}
