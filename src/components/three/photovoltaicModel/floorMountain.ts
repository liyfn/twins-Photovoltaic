import modelLoader from "../api/modelLoad";
import Scene from "../api/scene";

export default class FloorMountain {
  constructor() {
    this.init();
  }
  init() {
    // 加载山地模型
    modelLoader("/floor-mountain.glb", (glb) => {
      glb.scene.scale.set(1200, 1100, 1200);
      glb.scene.position.set(0, -2000, 0);
      Scene.getInstance().addMesh(glb.scene);
    });
  }
}
