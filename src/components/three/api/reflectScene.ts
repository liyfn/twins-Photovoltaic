import * as Three from "three";

// 生成一个辅助场景，用于观察单独的模型
export default class ReflectScene {
  private static _instance: ReflectScene | undefined = undefined;
  reflectScene: Three.Scene = new Three.Scene();
  fbo!: Three.WebGLRenderTarget;

  static getInstance() {
    if (!this._instance) this._instance = new ReflectScene();
    return this._instance;
  }

  init(container: HTMLElement) {
    this.reflectScene.name = "reflectScene";
    const renderTargetParameters: Three.RenderTargetOptions = {
      minFilter: Three.LinearFilter, // 定义了当被纹理化的像素映射到大于1纹理元素（texel）的区域时，将要使用的纹理缩小函数。LinearMipmapLinearFilter是默认值
      magFilter: Three.LinearFilter, // 定义了当被纹理化的像素映射到小于或者等于1纹理元素（texel）的区域时，将要使用的纹理放大函数。 LinearFilter：返回距离指定的纹理坐标最近的四个纹理元素的加权平均值，默认值
      stencilBuffer: false, // 渲染到模板缓冲区。默认为false.
    };
    this.fbo = new Three.WebGLRenderTarget(
      container.clientWidth,
      container.clientHeight,
      renderTargetParameters
    );
  }

  addMesh(mesh: Three.Mesh | Three.Group) {
    this.reflectScene.add(mesh);
  }

  removeMesh(mesh: Three.Mesh | Three.Group) {
    this.reflectScene.remove(mesh);
  }
}
