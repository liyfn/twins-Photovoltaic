import * as Three from "three";
import Line from "@/assets/img/line.png";
import Scene from "../../api/scene";
import { useSettingStore } from "@/store/setting";

export default class DronePath {
  private static _instance: DronePath | undefined = undefined;
  pointList: Three.Vector3[] = []; // 储存路径对应的顶点
  curve: Three.CatmullRomCurve3 | undefined = undefined; // 保存曲线
  pathList!: Three.Mesh; // 保存生成的mesh
  texture: Three.Texture; // 纹理贴图
  isShow = false; // 判断是否显示路径，不显示，就不loop

  constructor() {
    this.texture = new Three.TextureLoader().load(Line);
    this.texture.colorSpace = Three.SRGBColorSpace;
    this.texture.wrapS = this.texture.wrapT = Three.RepeatWrapping;
    this.texture.repeat.set(2, 1);
  }

  static getInstance() {
    if (!this._instance) this._instance = new DronePath();
    return this._instance;
  }
  // 初始化方法
  init(meshGroup: any, scale: number, height: number = 2000) {
    meshGroup.forEach((item: any, index: number) => {
      this.pointList.push(new Three.Vector3());
      item
        .getObjectByName(`HTMLTagEmpty${index + 1}`)
        .getWorldPosition(this.pointList[index])
        .multiplyScalar(scale);
    });
    // 映射成对应的高度
    this.pointList = this.pointList.map(
      (item) => new Three.Vector3(item.x, height, item.z)
    );
    this.createPath();
    this.generateLine();
    const setting = useSettingStore();
    this.isShow = setting.isShowDronePath;
    if (this.isShow) this.showDronePath();
  }

  // 根据顺序生成无人机的运动路线
  createPath(
    order: number[] = [1, 2, 5, 8, 7, 6, 3],
    isStartFromZreo: boolean = false
  ) {
    // 下标是否从0开始计算，不是，就需要 -1
    const flag = isStartFromZreo ? 0 : 1;
    const len = order.length;
    const line = [];
    // 根据顺序生成运动路线
    for (let i = 0; i < len; i++) {
      line.push(this.pointList[order[i] - flag]);
    }
    // 最后将首尾相连
    line.push(this.pointList[order[0] - flag]);
    this.curve = new Three.CatmullRomCurve3(line, false, "chordal");
  }
  // 将运动路线转换成模型
  generateLine() {
    const geometry = new Three.TubeGeometry(this.curve, 64, 20);
    const material = new Three.MeshLambertMaterial({
      color: 0xffffff,
      map: this.texture,
      side: Three.DoubleSide,
      transparent: true,
      blending: Three.NormalBlending,
    });
    this.pathList = new Three.Mesh(geometry, material);
  }
  // 将模型加载到场景中
  showDronePath() {
    Scene.getInstance().addMesh(this.pathList);
    this.isShow = true;
  }
  // 将模型从场景中移除
  hiddenDronePath() {
    Scene.getInstance().removeMesh(this.pathList);
    this.isShow = false;
  }
  // 让纹理贴图动起来
  loop() {
    if (this.isShow)
      (
        this.pathList.material as Three.MeshLambertMaterial
      ).map!.offset.x -= 0.01;
  }

  clearAll() {
    this.hiddenDronePath();
    this.texture.dispose();
  }
}
