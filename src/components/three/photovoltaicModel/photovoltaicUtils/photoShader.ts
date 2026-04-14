/*
 * @Description: shader的相关处理
 * @Author: caocong “caocong@hopewind.com”
 * @Date: 2025-02-08 16:00:48
 * @LastEditors: caocong “caocong@hopewind.com”
 * @LastEditTime: 2025-03-08 11:41:23
 * @FilePath: \digital_twins2\src\components\three\photovoltaicModel\photovoltaicUtils\photoShader.ts
 * Copyright 2025 Shenzhen Hopewind Electric Co., Ltd, All Rights Reserved.
 */
import * as Three from "three";
import Scene from "../../api/scene";

export default class PhotoShader {
  private static _instance: PhotoShader | undefined = undefined;
  originMesh!: Three.Group | Three.Mesh | undefined;
  originMaterial!: Three.MeshStandardMaterial; // 保存初始的材质信息
  inverterHeight: { value: number } = { value: 1.7 };

  mainOriginMaterial!: Three.MeshStandardMaterial; // 保存初始的材质信息
  sideOriginMaterial!: Three.MeshStandardMaterial; // 保存初始的材质信息
  panelWidth = { value: 42 };

  baseColor = { value: new Three.Color(0x00bfff) };
  flag = 1; // 正向还是逆向运动
  timer = 0; // 保存请求帧动画句柄

  lineGroup: Three.Group | null = null; // 保存线条组

  constructor() {}

  static getInstance() {
    if (!this._instance) this._instance = new PhotoShader();
    return this._instance;
  }
  // —————————— 周边房屋添加光带 ——————————
  roomLightBand(mesh: Three.Object3D) {
    const vertexShader = `
      varying vec3 vPosition;
      void main() {
        vPosition = position;
    `;
    const fragmentShader = `
      #include <dithering_fragment>
      float baseY = -3.0;
      float opacity = 0.0;
      for(int i = 0; i < 3; i++) {
        baseY += 1.5;
        opacity += 0.3;
        if(vPosition.y > baseY && vPosition.y < baseY + 0.3 ){
          gl_FragColor = vec4(uColor, opacity);
        }
      }
    `;
    const material = (mesh.children[3].children[0] as Three.Mesh)
      .material as Three.MeshStandardMaterial;
    material.onBeforeCompile = (shader) => {
      shader.uniforms.uColor = this.baseColor;
      shader.vertexShader = shader.vertexShader.replace(
        "void main() {",
        vertexShader
      );
      shader.fragmentShader = shader.fragmentShader.replace(
        "void main() {",
        `
        varying vec3 vPosition;
        uniform vec3 uColor;
        void main() {
        `
      );
      shader.fragmentShader = shader.fragmentShader.replace(
        "#include <dithering_fragment>",
        fragmentShader
      );
    };
  }
  // —————————— 逆变器扫光特效 启动/停止 API ——————————
  // 进行扫光处理 目标逆变器mesh
  addInverterSweep(mesh: Three.Mesh | Three.Group) {
    this.originMesh = mesh;
    // 所有的逆变器材质一致，保存一份即可
    if (!this.originMaterial)
      this.originMaterial = (mesh.children[1] as Three.Mesh)
        .material as Three.MeshStandardMaterial; // 保存一份原始信息，用于后续恢复
    // @ts-ignore
    mesh.children[1].material = this.originMaterial.clone(); // 将自身的材质信息独立出去，用于解决材质共享的Bug
    // @ts-ignore
    const material = mesh.children[1].material as Three.MeshStandardMaterial;

    const vertexCode = `
    varying vec3 vPosition; // 定义一个插值
    void main() {
      vPosition = position; // 局部坐标
    `;
    const fragmentCode = `
    varying vec3 vPosition;
    uniform float y;
    uniform float w;
    uniform vec3 uColor;
    void main() {
    `;
    material.onBeforeCompile = (shader) => {
      shader.uniforms.y = this.inverterHeight;
      shader.uniforms.w = { value: 0.2 };
      shader.uniforms.uColor = this.baseColor;
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
        if(vPosition.y < y && vPosition.y > y - w) {
          float per = (y - vPosition.y) / w;
          gl_FragColor.rgb = mix(uColor, gl_FragColor.rgb, per);
        } else if(vPosition.y < y + w && vPosition.y >= y) {
          float per = (vPosition.y - y) / w;
          gl_FragColor.rgb = mix(uColor, gl_FragColor.rgb, per);
        }
        `
      );
    };
    // 强制更新！（有时候需要，有时候不需要，怎么分情况目前不清楚）
    material.needsUpdate = true;

    this.lineGroup = new Three.Group();
    const pos = new Three.Vector3(); // 世界坐标位置
    const scale = new Three.Vector3(); // 放缩(模型统一没有旋转，这里不在考虑)
    // 创建线条材质
    const lineMaterial = new Three.LineBasicMaterial({
      color: "#1e90ff",
      linewidth: 2,
      transparent: true,
      depthWrite: false, // 解决模型在透明度为0时还能看见的Bug
    });
    // 其实不需要traverse去循环遍历，因为本身就已经是mesh了，但是不遍历可能会导致逆变器外壳的旋转出现问题(应该是因为画模型的时候，有些地方没有应用旋转导致的)
    // 处理外壳
    mesh.children[1].traverse((child) => {
      if ((child as Three.Mesh).isMesh) {
        const edges = new Three.EdgesGeometry(
          (child as Three.Mesh).geometry.clone()
        );
        const lineS = new Three.LineSegments(edges, lineMaterial);
        child.getWorldScale(scale);
        lineS.scale.copy(scale); // 设置成相同放大倍数。必须先放大，后设置位置，放大相对于原点
        child.getWorldPosition(pos); // 获取世界坐标进行对应(防止部分模型不在原点)
        lineS.position.copy(pos);
        this.lineGroup?.add(lineS);
      }
    });
    // 处理文字
    mesh.children[0].traverse((child) => {
      if ((child as Three.Mesh).isMesh) {
        const edges = new Three.EdgesGeometry(
          (child as Three.Mesh).geometry.clone()
        );
        const lineS = new Three.LineSegments(edges, lineMaterial);
        lineS.rotateX(-Math.PI / 2);
        lineS.rotateY(Math.PI);
        child.getWorldScale(scale);
        lineS.scale.copy(scale); // 设置成相同放大倍数。必须先放大，后设置位置，放大相对于原点
        child.getWorldPosition(pos); // 获取世界坐标进行对应(防止部分模型不在原点)
        lineS.position.copy(pos);
        this.lineGroup?.add(lineS);
      }
    });
    lineMaterial.onBeforeCompile = (shader) => {
      shader.uniforms.y = this.inverterHeight;
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
        if(vPosition.y < y + w + w && vPosition.y > y - w -w) {
          gl_FragColor = vec4(gl_FragColor.rgb, 1.0);
        }
        `
      );
    };
    Scene.getInstance().scene.add(this.lineGroup);
    // 开始动画
    this.inverterLoop();
  }
  // 清除目标的扫光效果
  removeInverterSweep() {
    this.cancelLoop();
    this.flag = 1;
    this.inverterHeight.value = 1.7; // 初始化时间信息
    // 清空不要的模型
    if (this.originMesh) {
      (this.originMesh.children[1] as Three.Mesh).material =
        this.originMaterial; // 恢复成共享材质
      this.originMesh = undefined;
    }
    if (this.lineGroup) {
      Scene.getInstance().scene.remove(this.lineGroup);
      this.lineGroup.traverse((child) => {
        (child as Three.LineSegments).geometry?.dispose();
        (
          (child as Three.LineSegments).material as Three.LineBasicMaterial
        )?.dispose();
      });
      this.lineGroup = null;
    }
  }
  // —————————— 组串扫光特效 启动/停止 API ——————————
  /**
   * @description: 组串扫光特效启动
   * @param {Three} group 组串所在的光伏方阵的group组
   * @param {number} row 目前要扫描的光伏组串行
   */
  addPanelSweep(group: Three.Group, row: number) {
    const mainMesh = group.children[row + 1].children[1] as Three.Mesh;
    const sideMesh = group.children[row + 1].children[0] as Three.Mesh; // 获取对应的mesh结构
    if (!this.mainOriginMaterial) {
      this.mainOriginMaterial = mainMesh.material as Three.MeshStandardMaterial;
      this.sideOriginMaterial = sideMesh.material as Three.MeshStandardMaterial; // 保存原始的材质信息
    }
    mainMesh.material = this.mainOriginMaterial.clone();
    sideMesh.material = this.sideOriginMaterial.clone(); // 将当前的mesh材质独立出来

    const vertexCode = `
    varying vec3 vPosition; // 定义一个插值
    void main() {
      vPosition = position; // 局部坐标
    `;
    const fragmentCode = `
    varying vec3 vPosition;
    uniform float x;
    uniform float w;
    uniform vec3 uColor;
    void main() {
    `;

    mainMesh.material.onBeforeCompile = sideMesh.material.onBeforeCompile = (
      shader
    ) => {
      shader.uniforms.x = this.panelWidth; // 定义一个uniform变量，用于控制光带生成的初始位置
      shader.uniforms.w = { value: 1 }; // 定义一个uniform变量，用于控制光带的宽度的一半
      shader.uniforms.uColor = this.baseColor; // 定义一个uniform变量，用于控制光带的宽度的一半
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
        if(vPosition.x < x && vPosition.x > x - w) {
          float per = (x - vPosition.x) / w;
          gl_FragColor.rgb = mix(uColor, gl_FragColor.rgb, per);
        } else if(vPosition.x < x + w && vPosition.x >= x) {
          float per = (vPosition.x - x) / w;
          gl_FragColor.rgb = mix(uColor, gl_FragColor.rgb, per);
        }
        `
      );
    };

    this.lineGroup = new Three.Group();
    const pos = new Three.Vector3();
    // 创建线条材质
    const lineMaterial = new Three.LineBasicMaterial({
      color: "#1e90ff",
      linewidth: 2,
      transparent: true,
      depthWrite: false, // 解决模型在透明度为0时还能看见的Bug
    });
    group.children[row + 1].traverse((child) => {
      if ((child as Three.Mesh).isMesh) {
        const edges = new Three.EdgesGeometry(
          (child as Three.Mesh).geometry.clone()
        );
        const lineS = new Three.LineSegments(edges, lineMaterial);
        lineS.scale.set(29, 29, 29); // 设置成相同放大倍数。必须先放大，后设置位置，放大相对于原点
        child.getWorldPosition(pos); // 获取世界坐标进行对应(防止部分模型不在原点)
        lineS.position.copy(pos);
        this.lineGroup?.add(lineS);
      }
    });
    lineMaterial.onBeforeCompile = (shader) => {
      shader.uniforms.x = this.panelWidth; // 定义一个uniform变量，用于控制光带生成的初始位置
      shader.uniforms.w = { value: 1 }; // 定义一个uniform变量，用于控制光带的宽度的一半
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
        if(vPosition.x < x + w + w && vPosition.x > x - w - w) {
          gl_FragColor = vec4(gl_FragColor.rgb, 1.0);
        }
        `
      );
    };

    Scene.getInstance().scene.add(this.lineGroup);

    this.panelLoop();
  }
  /**
   * @description: 组串扫光特效停止
   * @param {Three} group 组串所在的光伏方阵的group组
   * @param {number} row 目前要扫描的光伏组串行
   */
  removePanelSweep(group: Three.Group, row: number) {
    // 只有在这个材质有的情况下，说明之前扫描过(不一定是本方阵)，则可以取消，不判断大概率会报错
    if (this.mainOriginMaterial) {
      this.cancelLoop();
      this.flag = 1;
      this.panelWidth.value = 42; // 初始化时间信息
      const mainMesh = group.children[row + 1].children[1] as Three.Mesh;
      const sideMesh = group.children[row + 1].children[0] as Three.Mesh; // 获取对应的mesh结构
      mainMesh.material = this.mainOriginMaterial;
      sideMesh.material = this.sideOriginMaterial; // 恢复成共享材质
      // 清空不要的模型
      if (this.lineGroup) {
        Scene.getInstance().scene.remove(this.lineGroup);
        this.lineGroup.traverse((child) => {
          (child as Three.LineSegments).geometry?.dispose();
          (
            (child as Three.LineSegments).material as Three.LineBasicMaterial
          )?.dispose();
        });
        this.lineGroup = null;
      }
    }
  }
  // —————————— 特效循环 API ——————————
  // 让逆变器的扫光动画动起来
  inverterLoop() {
    this.inverterHeight.value -= 0.03 * this.flag;
    if (this.inverterHeight.value <= -1.8) this.flag = -1;
    else if (this.inverterHeight.value >= 1.7) this.flag = 1;
    this.timer = requestAnimationFrame(() => {
      this.inverterLoop();
    });
  }
  // 让光伏方阵组串的扫光动画动起来
  panelLoop() {
    this.panelWidth.value -= 0.2 * this.flag;
    if (this.panelWidth.value <= -42) this.flag = -1;
    else if (this.panelWidth.value >= 42) this.flag = 1;
    this.timer = requestAnimationFrame(() => {
      this.panelLoop();
    });
  }
  // 清除帧动画句柄
  cancelLoop() {
    cancelAnimationFrame(this.timer);
  }
}
