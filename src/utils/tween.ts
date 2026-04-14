import * as TWEEN from "@tweenjs/tween.js";

export default class Tween {
  private tween: TWEEN.Tween;
  private duration: number;
  constructor(startPos: any, endPos: any, duration?: number) {
    this.duration = duration ? duration : 2000;
    this.tween = new TWEEN.Tween(startPos).to(endPos, this.duration).start();
  }
  update() {
    this.tween.update();
  }
  onStart(callback: (...args: any) => any) {
    this.tween.onStart((obj) => callback(obj));
  }
  onUpdate(callback: (...args: any) => any) {
    this.tween.onUpdate((obj) => callback(obj));
  }
  onComplete(callback: (...args: any) => any) {
    this.tween.onComplete((obj) => callback(obj));
  }
}
