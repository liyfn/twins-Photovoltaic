import * as Three from "three";

export default class Renderer {
  private static _instance: Renderer | undefined = undefined;
  renderer: Three.WebGLRenderer;
  renderTarget!: Three.WebGLRenderTarget;

  constructor() {
    this.renderer = new Three.WebGLRenderer({
      antialias: true, // 抗锯齿
      logarithmicDepthBuffer: true, // 解决深度冲突
    });
    this.renderer.shadowMap.enabled = true; // 允许渲染器渲染阴影
    this.renderer.setPixelRatio(window.devicePixelRatio); // 设置像素比，降低锯齿
    // this.renderer.toneMapping = Three.ReinhardToneMapping; // 不能设置，否则太阳的光晕就消失了！！！
  }

  static getInstance() {
    if (!this._instance) this._instance = new Renderer();
    return this._instance;
  }

  init(container: HTMLElement) {
    this.renderTarget = new Three.WebGLRenderTarget(
      container.clientWidth,
      container.clientHeight,
      {
        minFilter: Three.LinearFilter,
        magFilter: Three.LinearFilter,
        format: Three.RGBAFormat,
        colorSpace: Three.SRGBColorSpace, // 重新设定颜色空间
      }
    );
    return this.renderer;
  }

  getCurRender() {
    return this.renderer;
  }
}
