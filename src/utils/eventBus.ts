/*
 * @Description: 事件总线
 * @Author: caocong “caocong@hopewind.com”
 * @Date: 2024-11-19 14:33:32
 * @LastEditors: caocong “caocong@hopewind.com”
 * @LastEditTime: 2024-11-26 10:20:00
 * @FilePath: \vite-three-rebuild\src\utils\eventBus.ts
 * Copyright 2024 Shenzhen Hopewind Electric Co., Ltd, All Rights Reserved.
 */
export default class EventBus {
  private static _instance: EventBus | undefined = undefined;
  eventList: { [key: string]: ((...args: any) => any)[] };

  constructor() {
    this.eventList = {};
  }

  static getInstance() {
    if (!this._instance) this._instance = new EventBus();
    return this._instance;
  }

  on(eventName: string, fn: (...args: any) => any) {
    if (!this.eventList[eventName]) this.eventList[eventName] = [];
    this.eventList[eventName].push(fn);
  }

  emit(eventName: string, ...args: any) {
    this.eventList[eventName]?.forEach((item) => {
      item.apply(null, args);
    });
  }
}
