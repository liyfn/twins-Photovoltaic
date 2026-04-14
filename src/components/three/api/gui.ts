import { GUI } from "three/examples/jsm/libs/lil-gui.module.min.js";

export default class Gui {
  private static _instance: Gui | undefined = undefined;
  gui: GUI;
  guiList: Map<string, GUI> = new Map();

  static getInstance() {
    if (!this._instance) this._instance = new Gui();
    return this._instance;
  }

  constructor() {
    this.gui = new GUI(); // 创建一个GUI对象，会直接在页面生成
    this.gui.domElement.style.top = "50px";
    this.gui.domElement.style.right = "0px";
    this.gui.domElement.style.width = "300px"; // 改变GUI元素的样式
    const origin = this.gui.addFolder("原始设置").close(); // 默认折叠
    origin.add(this.gui.domElement.style, "width", [
      "100px",
      "200px",
      "300px",
      "400px",
      "500px",
    ]);
  }
  // 创建一个组，如果想跨文件添加，就用这个，不想，原始的和这个都可以
  addFolder(name: string) {
    //如果已经存在这个组了，就直接返回
    if (this.guiList.get(name)) return this.guiList.get(name) as GUI;
    const folder = this.gui.addFolder(name);
    this.guiList.set(name, folder);
    return this.guiList.get(name) as GUI;
  }

  getCurGui() {
    return this.gui;
  }

  getFolder(name: string) {
    return this.guiList.get(name);
  }
}
