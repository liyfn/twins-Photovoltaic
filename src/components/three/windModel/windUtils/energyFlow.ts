import * as Three from "three";
import Scene from "../../api/scene";
import Line from "@/assets/img/line.png";

export default class EnergyFlow {
  // 起始位置
  startPos: number[][] = [];
  // 结束位置，理应只有一个
  endPos: number[] = [0, 0, 0];
  // 贝赛尔曲线
  curve: (Three.QuadraticBezierCurve3 | Three.LineCurve3)[][] = [];
  // Line模型
  lineList: Three.Mesh[][] = [];
  // 纹理贴图
  texture: Three.Texture;

  constructor(startPos: number[][], endPos: number[]) {
    this.startPos = startPos;
    this.endPos = endPos;
    this.texture = new Three.TextureLoader().load(Line);
    this.texture.colorSpace = Three.SRGBColorSpace;
    this.texture.wrapS = this.texture.wrapT = Three.RepeatWrapping;
    this.texture.repeat.set(2, 1);
  }

  init() {
    this.generateFlowLine();
    this.generateLine();
  }
  // 生成了能量流图(目前都是写死的)
  generateFlowLine() {
    let group = [4, 5]; // 分成两组
    for (let i = 0; i < group.length; i++) {
      this.curve.push([]);
      // 计算开始的下标
      let startNumber: number;
      if (i - 1 < 0) startNumber = 0;
      else startNumber = group[i - 1];
      for (let j = startNumber; j < startNumber + group[i]; j++) {
        const pStart = new Three.Vector3(
          this.startPos[j][0],
          this.startPos[j][1] + 20,
          this.startPos[j][2]
        );
        let pEnd;
        if (j + 1 < group[i] + startNumber) {
          pEnd = new Three.Vector3(
            this.startPos[j + 1][0],
            this.startPos[j + 1][1] + 20,
            this.startPos[j + 1][2]
          );
          this.curve[i].push(new Three.LineCurve3(pStart, pEnd));
        } else {
          // 最后一个连接到升压站
          pEnd = new Three.Vector3(
            this.endPos[0],
            this.endPos[1] + 20,
            this.endPos[2]
          );
          this.curve[i].push(new Three.LineCurve3(pStart, pEnd));
        }
      }
    }
  }
  // 根据路径生成模型
  generateLine() {
    for (let j = 0; j < this.curve.length; j++) {
      this.lineList.push([]);
      for (let i = 0; i < this.curve[j].length; i++) {
        const geometry = new Three.TubeGeometry(this.curve[j][i], 80, 10);
        const material = new Three.MeshLambertMaterial({
          color: 0xc0c0c0,
          map: this.texture,
          side: Three.DoubleSide,
          transparent: true,
          blending: Three.NormalBlending,
        });
        const mesh = new Three.Mesh(geometry, material);
        this.lineList[j].push(mesh);
        Scene.getInstance().addMesh(mesh);
      }
    }
  }
  // 纹理贴图流动
  loop() {
    this.lineList.forEach((item) => {
      item.forEach((mesh) => {
        if (mesh.material && (mesh.material as Three.MeshLambertMaterial).map) {
          (mesh.material as Three.MeshLambertMaterial).map!.offset.x -= 0.001;
        }
      });
    });
  }
  // 清空所有
  clearAll() {
    this.lineList.forEach((item) => {
      item.forEach((mesh) => {
        Scene.getInstance().removeMesh(mesh);
      });
    });
    this.lineList = [];
    this.texture.dispose();
  }
}
