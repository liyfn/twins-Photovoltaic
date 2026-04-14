import * as Three from "three";
import Scene from "../../api/scene";
import globalLayer from "@/config/layerConfig";

export default class PhotoShader {
  private static _instance: PhotoShader | undefined = undefined;
  originMesh!: Three.Mesh | undefined;
  originMaterial!: Three.MeshStandardMaterial; // 保存初始的材质信息
  windHeight: { value: number } = { value: 1.7 };
  // 保存计算的mesh的包围盒信息
  box: Three.Box3 | null = null;

  // flag = 1; // 正向还是逆向运动
  timer = 0; // 保存请求帧动画句柄

  lineGroup: Three.Group | null = null; // 保存线条组
  lineMesh: Three.LineSegments | null = null; // 保存单个线条

  constructor() {}

  static getInstance() {
    if (!this._instance) this._instance = new PhotoShader();
    return this._instance;
  }
  // —————————— 风机零部件扫光特效 启动/停止 API ——————————
  // 进行扫光处理 目标风机零部件mesh
  addPartsSweep(mesh: Three.Mesh) {
    this.originMesh = mesh;
    // 保存对应零部件mesh的材质
    this.originMaterial = mesh.material as Three.MeshStandardMaterial; // 保存一份原始信息，用于后续恢复
    mesh.material = this.originMaterial.clone(); // 将自身的材质信息独立出去，用于解决材质共享的Bug
    const material = mesh.material as Three.MeshStandardMaterial;
    material.transparent = true; // 不设置，会导致opacity为0时，出现白模

    this.box = new Three.Box3().expandByObject(mesh);
    // this.flag = 1;
    this.windHeight.value = this.box.max.y; // 因为不知道具体大小(或者有零有整)，采用包围盒获取模型缩放后的大小

    const vertexCode = `
    varying vec3 vPosition; // 定义一个插值
    void main() {
      vPosition = vec3(modelMatrix * vec4(position, 1.0)); // 世界坐标
    `;
    const fragmentCode = `
    varying vec3 vPosition;
    uniform float y;
    uniform float w;
    void main() {
    `;
    material.onBeforeCompile = (shader) => {
      shader.uniforms.y = this.windHeight;
      shader.uniforms.w = { value: 5 };
      // 在顶点着色器中对位置进行插值
      shader.vertexShader = shader.vertexShader.replace(
        "void main() {",
        vertexCode
      );
      // 在片元着色器中获取对应插值后的位置
      shader.fragmentShader = shader.fragmentShader.replace(
        "void main() {",
        fragmentCode
      );
      // 这段代码需要放在最后面，不然可能会被覆盖
      shader.fragmentShader = shader.fragmentShader.replace(
        "#include <dithering_fragment>",
        `
        #include <dithering_fragment>
        if(vPosition.y > y) {
          gl_FragColor = vec4(gl_FragColor.rgb, 0.0);
        }
        `
      );
    };

    const pos = new Three.Vector3();
    // 创建线条材质
    const lineMaterial = new Three.LineBasicMaterial({
      color: "#1e90ff",
      linewidth: 2,
      transparent: true,
      depthWrite: false, // 解决模型在透明度为0时还能看见的Bug
    });
    const edges = new Three.EdgesGeometry(mesh.geometry.clone()); // 为什么clone？因为主打一个以防万一！
    this.lineMesh = new Three.LineSegments(edges, lineMaterial);
    this.lineMesh.scale.set(17, 17, 17); // 风机放大倍数8.5，模型自身放大倍数为2(动画过程放大倍数由1到2)，因此设置成17
    this.lineMesh.rotateY(mesh.parent!.rotation.y); // 根据风机本身的旋转调整旋转角度
    mesh.getWorldPosition(pos); // 获取世界坐标进行对应，因为模型shader用的也是世界坐标
    this.lineMesh.position.copy(pos);
    // 线条逐渐出现
    lineMaterial.onBeforeCompile = (shader) => {
      shader.uniforms.y = this.windHeight;
      shader.uniforms.w = { value: 0.2 };
      shader.vertexShader = shader.vertexShader.replace(
        "void main() {",
        vertexCode
      );
      shader.fragmentShader = shader.fragmentShader.replace(
        "void main() {",
        fragmentCode
      );
      shader.fragmentShader = shader.fragmentShader.replace(
        "#include <dithering_fragment>",
        `
        #include <dithering_fragment>
        gl_FragColor = vec4(gl_FragColor.rgb, 0.0); // 看不见的时候需要隐藏
        if(vPosition.y > y) {
          gl_FragColor = vec4(gl_FragColor.rgb, 1.0);
        }
        `
      );
    };
    this.lineMesh?.layers.set(globalLayer.signalLayer);
    // 将其加入到场景中
    Scene.getInstance().addMesh(this.lineMesh);
    // 开始动画
    this.inverterLoop();
  }
  // 清除目标的扫光效果
  removePartsSweep() {
    this.cancelLoop();
    // 清空保存的模型，主要是恢复成原本的材质
    if (this.originMesh) {
      this.originMesh.material = this.originMaterial; // 恢复成共享材质
      this.originMesh = undefined;
      this.box = null;
    }
    // 清除线条模型
    if (this.lineMesh) {
      Scene.getInstance().removeMesh(this.lineMesh);
      this.lineMesh.geometry?.dispose();
      (this.lineMesh.material as Three.LineBasicMaterial)?.dispose();
      this.lineMesh = null;
    }
  }

  // —————————— 特效 API ——————————
  // 让零部件的的渐变动画动起来
  inverterLoop() {
    // 只跑一遍，TODO：可以用tween动画库进行优化，这样就可以保证不单独创建一个requestAnimationFrame了。
    if (this.windHeight.value >= this.box!.min.y) this.windHeight.value -= 0.3;
    this.timer = requestAnimationFrame(() => {
      this.inverterLoop();
    });
  }
  // 清除帧动画句柄
  cancelLoop() {
    cancelAnimationFrame(this.timer);
  }
}
