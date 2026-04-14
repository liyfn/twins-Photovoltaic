/*
 * @Description: 波纹提示类
 * @Author: caocong “caocong@hopewind.com”
 * @Date: 2024-12-04 11:03:41
 * @LastEditors: caocong “caocong@hopewind.com”
 * @LastEditTime: 2025-03-04 09:03:09
 * @FilePath: \digital_twins2\src\components\three\api\rippleReminder.ts
 * Copyright 2024 Shenzhen Hopewind Electric Co., Ltd, All Rights Reserved.
 */
import * as Three from "three";
import Scene from "./scene";

export default class RipperReminder {
  private static _instance: RipperReminder | undefined = undefined;
  rippleList: {
    name: string;
    mesh: Three.Mesh;
  }[] = []; // 存储波纹列表
  time: { value: number } = { value: 0 };

  static getInstance() {
    if (!this._instance) this._instance = new RipperReminder();
    return this._instance;
  }

  /**
   * @description: 增加扩散波纹提示
   * @param {string} name 所要添加的物体模型的名字，如风机1号
   * @param {string} color 所要添加的颜色，如#123456
   * @param {number[]} position 所要添加的物体模型的位置
   * @param {1000} ripperWidth 扩散半径
   * @param {1 / -1} rotateNegative 旋转的角度(因为只设置了背面可见，默认是垂直XOZ面)
   */
  addDiffusion(
    name: string,
    color: string,
    position: number[],
    ripperWidth = 1000, // 扩散宽度
    rotateNegative = -1 // 绕 X轴 旋转方向
  ) {
    // 已经有了Mesh，则不再重复创建，只需要将其的材质颜色改成对应的，然后加到场景就行
    const arr = this.rippleList.filter((item) => item.name === name);
    if (arr.length) {
      const material = arr[0].mesh.material as Three.ShaderMaterial;
      material.uniforms.uColor.value = new Three.Color(color);
      material.uniforms.uRadius.value = ripperWidth / 2;
      arr[0].mesh.position.set(position[0], position[1] + 20, position[2]);
      Scene.getInstance().addMesh(arr[0].mesh);
      return;
    }

    // 定义要传到着色器语言内的数据，这里面的time是随时间变化的
    const uniforms = {
      uColor: { value: new Three.Color(color) }, // 圆环的颜色
      uNumber: { value: 3 }, // 圆环的个数
      uSize: { value: 0.05 }, // 圆环的宽度
      time: this.time,
    };
    // 顶点着色器
    const vertexShader = `
      ${Three.ShaderChunk.common}
      ${Three.ShaderChunk.logdepthbuf_pars_vertex}
      varying vec2 vUv;
      void main() { 
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); // 位置设置
        ${Three.ShaderChunk.logdepthbuf_vertex}
      }
    `;
    // 片元着色器
    const fragmentShader = `
      ${Three.ShaderChunk.logdepthbuf_pars_fragment}
      varying vec2 vUv;
      uniform float uNumber; // 几个圆环
      uniform float uSize; // 圆环的宽度
      uniform float time; // 扩散的速度
      uniform vec3 uColor; // 扩散的颜色
      void main() {
        vec2 center = vec2(0.5, 0.5); // 中心点的位置
        float interval = (0.5 - uNumber * uSize) / uNumber; // 计算每个圆环之间的间隔
        float pos = mod(time, 0.5); // uv的中心点是0.5，如果超过了0.5，就需要转到0.5以内
        float dis = distance(vUv, center); // 计算当前uv到中心点的位置
        if(dis > 0.5) discard; // 如果不在0.5范围的圆内，丢弃该片段
        gl_FragColor = vec4(uColor, 0.5 - dis); // 默认的填充的其他位置的颜色值
        ${Three.ShaderChunk.logdepthbuf_fragment}
        float flag = 0.0; // 判断圆环是否跨过了0.5这一关
        for(int i = 0; i < int(uNumber); i++) {
          flag = 0.0; // 默认没有跨过0.5
          if(pos > 0.5) pos -= 0.5;
          else if(pos < 0.5 && pos + uSize > 0.5) flag = 1.0; // 跨过0.5时单独处理
          if((dis > pos && dis < pos + uSize) || (flag == 1.0 && dis < pos + uSize - 0.5)) {
            gl_FragColor = vec4(uColor, 1.0); // 颜色设置
            return; // 有满足的就可以返回了，因为main函数对每一个点都会执行一次，这里就不需要完整的进行循环了
          }
          pos += interval + uSize; // 更新下一个圆环的位置
        }
      }
    `;
    // 将这个材质放到一个平面上
    const geometry = new Three.PlaneGeometry(ripperWidth, ripperWidth);
    const material = new Three.ShaderMaterial({
      uniforms,
      transparent: true, // 要透明，不能看见平面模型
      vertexShader: vertexShader, // 顶点着色器
      fragmentShader: fragmentShader, // 片元着色器
      side: Three.BackSide, // 仅背面可见，原因是想让海上只能看见地震波在水面的投影
      // depthTest: false,
      // renderOrder: 10,
    });

    const mesh = new Three.Mesh(geometry, material);
    mesh.rotateX((rotateNegative * Math.PI) / 2); // 根据水面还是陆地进行旋转
    mesh.position.set(position[0], position[1] + 20, position[2]);
    Scene.getInstance().addMesh(mesh);

    this.rippleList.push({
      name,
      mesh,
    });
  }
  // addDiffusion(
  //   name: string,
  //   type: "warning" | "danger",
  //   color: string,
  //   position: number[],
  //   ripperWidth = 1000, // 扩散宽度
  //   rotateNegative = -1 // 绕 X轴 旋转方向
  // ) {
  //   // 已经有了Mesh，则不再重复创建，只需要将其的材质颜色改成对应的，然后加到场景就行
  //   const arr = this.rippleList.filter((item) => item.name === name);
  //   if (arr.length) {
  //     const material = arr[0].mesh.material as Three.ShaderMaterial;
  //     material.uniforms.uColor.value = new Three.Color(color);
  //     material.uniforms.uRadius.value = ripperWidth / 2;
  //     arr[0].mesh.position.set(position[0], position[1] + 10, position[2]);
  //     Scene.getInstance().addMesh(arr[0].mesh);
  //     return;
  //   }

  //   // 顶点着色器
  //   const vertexShader = `
  //     varying vec2 vUv;
  //     void main() {
  //       vUv = uv;
  //       gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); // 位置设置
  //     }
  //   `;
  //   // 片元着色器
  //   const fragmentShader = `
  //     varying vec2 vUv;
  //     uniform vec3 uColor;
  //     uniform float uOpacity;
  //     uniform float uSpeed;
  //     uniform float uSge;
  //     uniform float time;
  //     float PI = 3.14159265;
  //     // 画圆，以及改变不同位置的透明度
  //     float drawCircle(float index, float range) {
  //       float opacity = 1.0;
  //       if (index >= 1.0 - range) {
  //         opacity = 1.0 - (index - (0.8 - range)) / range;
  //       } else if(index <= range) {
  //         opacity = (index + 0.1) / range;
  //       }
  //       return opacity;
  //     }
  //     void main() {
  //       float iTime = -time * uSpeed;
  //       float opacity = 0.0;
  //       float len = distance(vec2(0.5, 0.5), vUv); // 计算距离圆心的距离
  //       float size = 1.0 / uSge;
  //       vec2 range = vec2(0.45, 0.75);
  //       float index = mod(iTime + len, size);
  //       // 中心圆
  //       vec2 cRadius = vec2(0.06, 0.12);
  //       if (len <= 0.5 && index < size) {
  //         float i = sin(index / size * PI);
  //         // 处理边缘锯齿
  //         if (i >= range.x && i <= range.y){
  //           // 归一
  //           float t = (i - range.x) / (range.y - range.x);
  //           // 边缘锯齿范围
  //           float r = 0.3;
  //           opacity = drawCircle(t, r);
  //         }
  //         // 渐变
  //         opacity +=  1.0 - len / 0.5;
  //       };
  //       gl_FragColor = vec4(uColor, uOpacity * opacity);
  //     }
  //   `;
  //   // 将这个材质放到一个平面上
  //   const geometry = new Three.PlaneGeometry(ripperWidth, ripperWidth);
  //   // 定义要传到着色器语言内的数据，这里面的time是随时间变化的
  //   const uniforms = {
  //     uColor: { value: new Three.Color(color) },
  //     uOpacity: { value: 1.0 },
  //     uSpeed: { value: 0.05 },
  //     uSge: { value: 3.0 },
  //     uRadius: { value: ripperWidth / 2 },
  //     time: this.time,
  //   };
  //   const material = new Three.ShaderMaterial({
  //     uniforms,
  //     transparent: true, // 要透明，不能看见平面模型
  //     vertexShader: vertexShader, // 顶点着色器
  //     fragmentShader: fragmentShader, // 片元着色器
  //     side: Three.BackSide, // 仅背面可见，原因是想让海上只能看见地震波在水面的投影
  //   });

  //   const mesh = new Three.Mesh(geometry, material);
  //   mesh.rotateX((rotateNegative * Math.PI) / 2); // 根据水面还是陆地进行旋转
  //   mesh.material.depthTest = false; // 保证mesh的渲染不被其他的模型所遮挡
  //   // mesh.renderOrder = 10; // 渲染顺序
  //   mesh.position.set(position[0], position[1] + 10, position[2]);
  //   Scene.getInstance().addMesh(mesh);

  //   this.rippleList.push({
  //     name,
  //     mesh,
  //   });
  // }

  /**
   * @description: 从场景中移除单个的波纹扩散
   * @param {string} name 模型物体的名字，如风机1号
   */
  removeDiffusion(name: string) {
    let arr = this.rippleList.filter((item) => item.name === name);
    if (arr.length) {
      Scene.getInstance().scene.remove(arr[0].mesh);
      return;
    }
  }
  // 波纹的动态效果
  loop() {
    this.time.value += 0.001; // 这个大小应该根据帧数设置(60帧下，这个效果还可以，不快不慢)
  }
  // 在场景中清空所有的模型
  clearAll() {
    this.rippleList.forEach((item) => {
      Scene.getInstance().removeMesh(item.mesh);
    });
    this.rippleList = [];
  }
}
