/*
 * @Description: 后处理相关API
 * @Author: caocong “caocong@hopewind.com”
 * @Date: 2025-02-19 19:20:35
 * @LastEditors: caocong “caocong@hopewind.com”
 * @LastEditTime: 2025-03-03 09:43:12
 * @FilePath: \digital_twins2\src\components\three\api\postProcess.ts
 * Copyright 2025 Shenzhen Hopewind Electric Co., Ltd, All Rights Reserved.
 */
import * as Three from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import {
  OutlinePass, // 描边通道，模拟物体发光
  FXAAShader,
  UnrealBloomPass, // 泛光通道，感觉这个只能在暗色的场景里面使用，针对明亮的物体，发光
  ShaderPass, // 自定义shader通道
  RenderPass, // 渲染通道
  GammaCorrectionShader, // 伽马颜色校正后处理Shader
} from "three/examples/jsm/Addons.js";
import Renderer from "./renderer";
import Scene from "./scene";
import Camera from "./camera";
import Gui from "./gui";
import EventBus from "@/utils/eventBus";

export default class PostProcess {
  private static _instance: PostProcess | undefined = undefined;
  composer!: EffectComposer;
  finalComposer!: EffectComposer;
  renderPass!: RenderPass;
  unrealBloomPass!: UnrealBloomPass;
  outlinePass!: OutlinePass;
  // 保存描边发光的模型数组
  outlineMap: Map<string, Three.Mesh> = new Map();

  static getInstance() {
    if (!this._instance) this._instance = new PostProcess();
    return this._instance;
  }

  init(container: HTMLElement) {
    // 创建effect后处理器
    this.composer = new EffectComposer(
      Renderer.getInstance().renderer,
      Renderer.getInstance().renderTarget
    );
    // 设置成一半，用来降低分辨率，可以很好地提高性能(FPS从40提高到了60，就是特效看起来变得有些模糊了！这个可以动态的添加到设置中)
    this.composer.setSize(container.clientWidth, container.clientHeight); // 设置大小
    // this.composer.setSize(
    //   container.clientWidth * 0.5,
    //   container.clientHeight * 0.5
    // ); // 设置大小
    this.composer.setPixelRatio(window.devicePixelRatio); // 设置像素比

    // 渲染通道
    this.renderPass = new RenderPass(
      Scene.getInstance().scene,
      Camera.getInstance().camera!
    );
    this.composer.addPass(this.renderPass); // 添加

    const v2 = new Three.Vector2(container.clientWidth, container.clientHeight);

    // 创建泛光通道，暂时不使用，参数是 canvas画布尺寸、场景、相机以及选填的 模型数组
    this.unrealBloomPass = new UnrealBloomPass(v2, 1, 0.4, 0.1);
    this.unrealBloomPass.renderToScreen = true;
    this.composer.addPass(this.unrealBloomPass);

    // 创建描边通道
    this.outlinePass = new OutlinePass(
      v2,
      Scene.getInstance().scene,
      Camera.getInstance().camera!
    );
    this.outlinePass.visibleEdgeColor.set(0xffff00); // 设置描边颜色，默认是0xffffff
    this.outlinePass.edgeThickness = 2; // 描边厚度，默认为1
    this.outlinePass.edgeStrength = 6; // 描边亮度，默认为3
    this.outlinePass.pulsePeriod = 1; // 描边闪烁，默认0不闪烁，值越大，闪烁周期越长
    this.composer.addPass(this.outlinePass); // 添加描边后处理通道

    const effectFXAA = new ShaderPass(FXAAShader);
    effectFXAA.uniforms["resolution"].value.set(
      0.6 / container.clientWidth,
      0.6 / container.clientHeight
    ); // 渲染区域Canvas画布宽高度  不一定是全屏，也可以是区域值
    effectFXAA.renderToScreen = true;
    this.composer.addPass(effectFXAA);
    // 创建SMAA抗锯齿通道
    // const pixelRatio = Renderer.getInstance().renderer.getPixelRatio();
    // const smaaPass = new SMAAPass(
    //   container.clientWidth * pixelRatio,
    //   container.clientHeight * pixelRatio
    // );
    // this.composer.addPass(smaaPass);

    // 创建伽马颜色矫正通道
    const gammaPass = new ShaderPass(GammaCorrectionShader);
    this.composer.addPass(gammaPass);
    // 着色器通道容器--放进容器里
    const finalPass = new ShaderPass(
      new Three.ShaderMaterial({
        uniforms: {
          finalTexture: { value: null },
          bloomTexture: { value: this.composer.renderTarget2.texture },
        },
        vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }`, // 这个代码一般不变
        fragmentShader: `
        uniform sampler2D finalTexture;
        uniform sampler2D bloomTexture;
        varying vec2 vUv;
        void main() {
          gl_FragColor = texture2D(finalTexture, vUv) + vec4(1.0) * texture2D(bloomTexture, vUv);
          // if(vUv.x < intToTwo) {
          //   gl_FragColor = vec4(gl_FragColor.rgb, 0.5);
          // }
        }`,
        defines: {
          // intToTwo: 0.5, // 这里定义的值，可以在顶点和片元着色器里面直接使用
        },
      }),
      "finalTexture" // 这里的id和目标的uniforms里面的变量一致，会将最终的2D结果传给那个变量！默认值都是tDiffuse
    );
    finalPass.needsSwap = true;
    this.finalComposer = new EffectComposer(
      Renderer.getInstance().renderer,
      Renderer.getInstance().renderTarget
    );
    this.finalComposer.addPass(this.renderPass);
    this.finalComposer.addPass(finalPass);
    this.finalComposer.addPass(effectFXAA);
    this.finalComposer.addPass(gammaPass);

    // 创建输出通道，防止点击发光后场景颜色变暗
    // const outputPass = new OutputPass();
    // this.composer.addPass(outputPass);

    this.addEvent();

    return {
      composer: this.composer,
      finalComposer: this.finalComposer,
    };
  }
  // 添加一个后处理通道
  addPass(pass: any) {
    this.composer.addPass(pass);
  }
  // 删除一个后处理通道
  removePass(pass: any) {
    this.composer.removePass(pass);
  }
  // 添加对应的模型的描边
  addOutline(mesh: Three.Mesh) {
    if (this.outlineMap.get(mesh.name)) return; // 重复添加
    this.outlineMap.set(mesh.name, mesh);
    this.outlinePass.selectedObjects = [...this.outlineMap.values()];
  }
  // 移除制定模型的描边
  removeOutline(mesh: Three.Mesh) {
    if (!this.outlineMap.get(mesh.name)) return; // 没有怎么删
    this.outlineMap.delete(mesh.name);
    this.outlinePass.selectedObjects = [...this.outlineMap.values()];
  }
  // 移除所有模型的描边通道
  removaAllOutline() {
    this.outlineMap.clear();
    this.outlinePass.selectedObjects = [];
  }
  getCurComposer() {
    return this.composer;
  }

  addEvent() {
    EventBus.getInstance().on("techStyleModel", () => {
      const folder = Gui.getInstance().addFolder("辉光");
      folder.add(this.unrealBloomPass, "strength", 0, 2);
      folder.add(this.unrealBloomPass, "radius", 0, 1);
      folder.add(this.unrealBloomPass, "threshold", 0, 1);
    });
  }
}
