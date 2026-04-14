import * as Three from "three";
import Renderer from "./renderer";
import ReflectScene from "./reflectScene";
import Scene from "./scene";
import Camera from "./camera";
import Trans from "@/assets/img/transition5.png";

// 场景过渡的类，原理就是在场景切换中间渲染一个新的场景
export default class TransitionScene {
  private static _instance: TransitionScene | undefined = undefined;
  transitionParams;
  sceneStart: Three.Scene = Scene.getInstance().scene; // 默认初始开始肯定是默认场景
  sceneTo: Three.Scene = ReflectScene.getInstance().reflectScene;
  transScene: Three.Scene = new Three.Scene(); // 生成一个过渡场景
  transCamera: Three.OrthographicCamera;
  transMaterial;
  transPlane;
  renderer;

  constructor() {
    this.transitionParams = {
      transition: 0, // 起始是0，结束是1，自加过渡速度
      animate: false, // 是否正在动画过程中(执行过程中不能打断，应该让相关按钮禁用)
    }; // 过渡的参数

    this.renderer = Renderer.getInstance().renderer;

    // 使用正交相机进行观察
    this.transCamera = new Three.OrthographicCamera(
      window.innerWidth / -2,
      window.innerWidth / 2,
      window.innerHeight / 2,
      window.innerHeight / -2,
      -10,
      10
    );
    // 自定义过渡效果的shader
    this.transMaterial = new Three.ShaderMaterial({
      uniforms: {
        tDiffuse1: { value: null }, // 过渡到的场景纹理贴图
        tDiffuse2: { value: null }, // 过渡之前的场景纹理贴图
        mixRatio: { value: 0 }, // 混合的比例
        threshold: { value: 0.1 }, // 阈值，固定不变
        useTexture: { value: true }, // 是否使用纹理贴图
        tMixTexture: { value: new Three.TextureLoader().load(Trans) }, // 过渡过程中混合的纹理贴图
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
       `,
      fragmentShader: `
        uniform float mixRatio;
        uniform sampler2D tDiffuse1;
        uniform sampler2D tDiffuse2;
        uniform sampler2D tMixTexture;
        uniform bool useTexture;
        uniform float threshold;
        varying vec2 vUv;
        void main() {
            vec4 texel1 = texture2D(tDiffuse1, vUv);
            vec4 texel2 = texture2D(tDiffuse2, vUv);
            if (useTexture == true) {
              vec4 transitionTexel = texture2D(tMixTexture, vUv);
              float r = mixRatio * (1.0 + threshold * 2.0) - threshold;
              float mixf = clamp((transitionTexel.r - r) * (1.0 / threshold), 0.0, 1.0);
              gl_FragColor = mix(texel1, texel2, mixf);
            } else {
              gl_FragColor = mix(texel2, texel1, mixRatio);
            }
        }
        `,
    });
    const geometry = new Three.PlaneGeometry(
      window.innerWidth,
      window.innerHeight
    ); // 一个平面，大小正好盖住整个容器
    this.transPlane = new Three.Mesh(geometry, this.transMaterial); // 生成该模型
    this.transScene.add(this.transPlane); // 添加到过渡场景中
  }

  static getInstance() {
    if (!this._instance) this._instance = new TransitionScene();
    return this._instance;
  }

  // 切换场景
  update(sceneTo: Three.Scene) {
    // 动画正在执行中
    if (this.transitionParams.animate) return false;

    // 获取传过来的数据
    this.sceneTo = sceneTo; // 获取目标场景
    // 初始化
    this.transitionParams.transition = 0; // 归0，需要重新设置，后面会变
    this.transitionParams.animate = true; // 判断是否正在动画中
    if (sceneTo.name === "reflectScene") {
      this.transMaterial.uniforms.tDiffuse1.value =
        ReflectScene.getInstance().fbo.texture;
      this.transMaterial.uniforms.tDiffuse2.value =
        Scene.getInstance().fbo.texture;
    } else {
      this.transMaterial.uniforms.tDiffuse1.value =
        Scene.getInstance().fbo.texture;
      this.transMaterial.uniforms.tDiffuse2.value =
        ReflectScene.getInstance().fbo.texture;
    }
    this.transMaterial.uniforms.mixRatio.value = 0; // 归0，需要重新设置
  }
  // 渲染过程
  render() {
    if (this.transitionParams.transition <= 0) {
      // 如果为0，说明没有动画，那就渲染改变前的场景，参数默认是false
      this.renderer.setRenderTarget(null);
      this.renderer.render(this.sceneStart!, Camera.getInstance().camera!);
    } else if (this.transitionParams.transition >= 1) {
      // 如果大于1，说明已经完全转换完成，渲染改变后的场景
      this.renderer.setRenderTarget(null);
      this.renderer.render(this.sceneTo!, Camera.getInstance().camera!);
      this.transitionParams.animate = false;
      setTimeout(() => {
        this.sceneStart = this.sceneTo;
        this.transitionParams.transition = 0;
      });
    } else {
      // 否则，就是在动画中，就渲染过渡场景，离屏渲染
      this.renderer.setRenderTarget(Scene.getInstance().fbo);
      this.renderer.clear();
      this.renderer.render(
        Scene.getInstance().scene,
        Camera.getInstance().camera!
      ); // 你得render一下，才能把纹理输出给fbo对象啊！！！！然后前面通过赋值操作，就可以在shaderMaterial中获取到相应的纹理了！
      this.renderer.setRenderTarget(ReflectScene.getInstance().fbo);
      this.renderer.clear();
      this.renderer.render(
        ReflectScene.getInstance().reflectScene,
        Camera.getInstance().camera!
      );

      this.renderer.setRenderTarget(null); // 将二者的离屏渲染渲染到屏幕上，可以看到过渡效果
      this.renderer.clear();
      this.renderer.render(this.transScene, this.transCamera);
    }

    if (
      this.transitionParams.animate &&
      this.transitionParams.transition <= 1
    ) {
      // 动画还在执行过程中，动态改变当前动画进度和混合程度
      this.transitionParams.transition += 0.01;
      this.transMaterial.uniforms.mixRatio.value =
        this.transitionParams.transition;
    }
  }
}
