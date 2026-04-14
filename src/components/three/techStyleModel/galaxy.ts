import * as Three from "three";
// import Gui from "../api/gui";
import Scene from "../api/scene";
import Camera from "../api/camera";

export default class Galaxy {
  private static _instance: Galaxy | undefined = undefined;
  trailSys; // 粒子系统
  trailCount = 2500; // 粒子个数
  speed = 0.0001; // 旋转速度
  scale = 5000; // 缩放倍数
  meteorTime = { value: 0 }; // 流星运动时间控制
  meteorLen = { value: 100 }; // 流星轨迹的总长度的点个数
  meteorGeo: Three.BufferGeometry;
  baseColor = { value: new Three.Color(0x00bfff) };

  constructor() {
    const trailGeo = new Three.BufferGeometry();

    const trailPos = new Float32Array(this.trailCount * 3); // 三个坐标构成一个点的坐标

    for (let i = 0; i < trailPos.length; i++)
      trailPos[i] = (Math.random() - 0.5) * 20; // 位置随机生成，范围[-10, 10]

    trailGeo.setAttribute("position", new Three.BufferAttribute(trailPos, 3)); // 位置设置

    const trailMaterial = new Three.PointsMaterial({
      color: this.baseColor.value,
      size: 0.2,
      transparent: true,
      opacity: 0.8,
    });
    // 由于这个不是Mesh，需要用isPoints属性进行判断。主循环用的isMesh，就把这个给略过去了，所以会受辉光影响，这也正好！
    this.trailSys = new Three.Points(trailGeo, trailMaterial);
    this.trailSys.name = "星空";
    this.trailSys.scale.set(this.scale, this.scale, this.scale);
    this.trailSys.position.y = 200;
    Scene.getInstance().scene.add(this.trailSys);

    // 生成流星的例子
    const meteorShaderParams = {
      uniforms: {
        u_time: this.meteorTime,
        u_size: { value: 2 }, // 最大的点的大小
        u_range: { value: 2000 }, // 可见的点的个数（即拖尾的长度）
        u_total: this.meteorLen, // 先给个默认值，后面要变
        u_color: this.baseColor,
      },
      // 一个新的思路：不是用的自带的uv，position啥的，而是自己定义了一个条件
      vertexShader: `
        attribute float a_index; // 数组长度 347，这里应该会按照点个数自动赋值判断
        uniform float u_time;
        uniform float u_size;
        uniform float u_range;
        uniform float u_total;
        varying float v_opacity; // 当前点的透明度
        void main() {
            float size = u_size;
            float cur_index = u_total * mod(u_time, 1.5); // 取余保证自动的循环动画(不设置成1是因为消失有点突兀)
            v_opacity = 0.0;
            if (cur_index > a_index && cur_index < a_index + u_range) {
                // 拖尾效果
                float index = (a_index + u_range - cur_index) / u_range; // 归一化，越远离当前的cur_index，越接近于1
                size *= index; // 按照比例进行缩放片元的大小
                v_opacity = 1.0; // 只要在这个的范围，就能看见，否则看不见
            }
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            gl_PointSize = size; // 赋值给当前的点大小
        }
      `,
      fragmentShader: `
        uniform vec3 u_color;
        varying float v_opacity;
        void main() {
          gl_FragColor = vec4(u_color, v_opacity);
        }
      `,
    };
    this.meteorGeo = new Three.BufferGeometry();

    const material = new Three.ShaderMaterial({
      ...meteorShaderParams,
      side: Three.DoubleSide,
      transparent: true,
      blending: Three.NormalBlending,
    });
    const path = new Three.Points(this.meteorGeo, material);
    Scene.getInstance().scene.add(path);
    // 间隔生成流星效果
    setInterval(() => {
      this.createMeteor();
    }, 5000);
  }

  static getInstance() {
    if (!this._instance) this._instance = new Galaxy();
    return this._instance;
  }

  createMeteor() {
    // 获取当前摄像机的位置
    const l = 3000;
    const curPos = Camera.getInstance().camera?.position.clone();
    curPos!.x = -curPos!.x;
    curPos!.z = -curPos!.z; // 取反，在摄像机的对面观察流星
    const startPos = curPos?.normalize().clone().multiplyScalar(5000); // 归一化，后转到对应的位置，作为起始点
    startPos!.y = 4500;
    const endPos = new Three.Vector3(
      startPos!.x - l,
      startPos!.y - 2000,
      startPos!.z + l
    );
    const centerPos = new Three.Vector3(
      startPos!.x - 1220,
      startPos!.y - 500,
      startPos!.z + 850
    );
    // 生成路径曲线
    const curve = new Three.QuadraticBezierCurve3(startPos, centerPos, endPos);
    // 生成路径中点的个数
    const len = parseInt(startPos!.distanceTo(endPos).toString());
    const points = curve.getSpacedPoints(len);
    const positions: number[] = [];
    const aIndexes: number[] = [];
    points.forEach((item, index) => {
      positions.push(item.x, item.y, item.z);
      aIndexes.push(index);
    });

    this.meteorLen.value = len; // 修改流星的总点个数
    this.meteorTime.value = 0; // 流星运动

    // 动态更改流星的内部数据
    this.meteorGeo.attributes.position = new Three.BufferAttribute(
      new Float32Array(positions),
      3
    );
    this.meteorGeo.attributes["a_index"] = new Three.BufferAttribute(
      new Float32Array(aIndexes),
      1
    );
  }

  loop() {
    this.trailSys.rotation.y += this.speed;
    this.meteorTime.value <= 1.5 && (this.meteorTime.value += 0.03);
  }
}
