/*
 * @Description: 状态修改
 * @Author: caocong “caocong@hopewind.com”
 * @Date: 2025-01-15 09:34:38
 * @LastEditors: caocong “caocong@hopewind.com”
 * @LastEditTime: 2025-01-16 14:06:56
 * @FilePath: \three-wind\src\store\setting.ts
 * Copyright 2025 Shenzhen Hopewind Electric Co., Ltd, All Rights Reserved.
 */
import EventBus from "../utils/eventBus";

export const useSettingStore = defineStore(
  "setting",
  () => {
    const radius = ref(60);
    const isAutoInspect = ref(true);
    const isShowDrone = ref(true);
    const isShowDronePath = ref(false);
    // 设置巡检的半径大小
    const setRadius = (val: number) => {
      radius.value = val;
      EventBus.getInstance().emit("settingRadius", val);
    };
    // 设置入场后是否自动巡检
    const setIsAutoInspect = (val: boolean) => {
      isAutoInspect.value = val;
      EventBus.getInstance().emit("settingAutoInspect", val);
    };
    // 显示/隐藏 无人机
    const setShowDrone = (val: boolean) => {
      isShowDrone.value = val;
      EventBus.getInstance().emit("settingShowDrone", val);
    };
    // 显示/隐藏 无人机巡查路径
    const setShowDronePath = (val: boolean) => {
      isShowDronePath.value = val;
      EventBus.getInstance().emit("settingShowDronePath", val);
    };

    return {
      radius,
      setRadius,
      isAutoInspect,
      setIsAutoInspect,
      isShowDronePath,
      setShowDronePath,
      isShowDrone,
      setShowDrone,
    };
  },
  {
    persist: true,
  }
);
