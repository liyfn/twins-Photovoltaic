/*
 * @Description: 科技风光伏
 * @Author: caocong “caocong@hopewind.com”
 * @Date: 2025-01-02 15:11:54
 * @LastEditors: caocong “caocong@hopewind.com”
 * @LastEditTime: 2025-05-15 09:13:05
 * @FilePath: \digital_twins2\src\components\three\techStyleModel\techPhotovoltaic.ts
 * Copyright 2025 Shenzhen Hopewind Electric Co., Ltd, All Rights Reserved.
 */
// 科技风的光伏场景
import * as Three from "three";
import modelLoader from "../api/modelLoad";
import Scene from "../api/scene";
import globalLayer from "@/config/layerConfig";

export default class TechPhotovoltaic {
  lineGroup: Three.LineSegments[] = [];
  baseColor = { value: new Three.Color(0x00bfff) };

  constructor(data: any) {
    this.init(data);
    this.addEvent();
  }
  init(data: any) {
    console.log(data);
    modelLoader("/techPhotoSquare_compress.glb", (glb) => {
      glb.scene.scale.set(30, 30, 30);
      glb.scene.position.set(0, 0, 0);
      glb.scene.children.forEach((item: Three.Object3D) => {
        if (item.name.includes("panel")) {
          item.traverse((child) => {
            if ((child as Three.Mesh).isMesh && child.name.includes("1_1")) {
              const line = this.createLine(child as any);
              line.layers.enable(globalLayer.processLayer); // 不能用set，只能enable，原因不明
              this.lineGroup.push(line);
            }
          });
        } else if (item.name === "room1_empty") {
          this.roomLightBand(item.children[0].children[1]); // 材质共享
        } else if (item.name === "room2_empty" || item.name === "room3_empty") {
          this.roomLightBand(item.children[0]); // 材质共享
        }
      });
      Scene.getInstance().addMesh(glb.scene);
      Scene.getInstance().scene.add(...this.lineGroup);
    });
  }

  createLine(model: Three.Mesh) {
    const edges = new Three.EdgesGeometry(model.geometry, 20);
    const line = new Three.LineSegments(
      edges,
      new Three.LineBasicMaterial({
        color: this.baseColor.value,
      })
    );
    const quar = new Three.Quaternion(); // 四元数旋转
    const pos = new Three.Vector3(); // 三维位置信息
    const scale = new Three.Vector3(); // 三维缩放信息
    model.getWorldPosition(pos);
    model.getWorldQuaternion(quar);
    model.getWorldScale(scale); // 这里肯定是应用缩放旋转后的，需要获取全局
    line.scale.copy(scale);
    line.position.copy(pos);
    line.quaternion.copy(quar);
    return line;
  }

  roomLightBand(mesh: Three.Object3D) {
    const vertexShader = `
      varying vec3 vPosition;
      void main() {
        vPosition = position;
    `;
    const fragmentShader = `
      #include <dithering_fragment>
      float baseY = 0.0;
      float opacity = 0.0;
      for(int i = 0; i < 3; i++) {
          baseY += 0.5;
          opacity += 0.3;
          if(vPosition.y > baseY && vPosition.y < baseY + 0.1 ){
              gl_FragColor = vec4(uColor, opacity);
          }
      }
    `;
    const material = (mesh.children[0] as Three.Mesh)
      .material as Three.MeshStandardMaterial;
    material.transparent = true;
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

  // 添加监听事件
  addEvent() {}

  emitEvent() {}
}
