/*
 * @Description:
 * @Author: caocong “caocong@hopewind.com”
 * @Date: 2025-03-06 10:52:43
 * @LastEditors: caocong “caocong@hopewind.com”
 * @LastEditTime: 2025-03-06 14:22:13
 * @FilePath: \digital_twins2\src\utils\utils.ts
 * Copyright 2025 Shenzhen Hopewind Electric Co., Ltd, All Rights Reserved.
 */
import * as THREE from "three";

/**
 * 获取模型中心点和高度差
 * @param {*} mesh 目标模型对象
 * @returns { center: 中心点坐标, uHeight: 高度差值 }
 */
export const getBoxCenter = (mesh: THREE.Mesh) => {
  let box = new THREE.Box3();
  // expandByObject：包裹在包围盒中的3d对象
  box.expandByObject(mesh);
  // 计算包围盒的中心点三维坐标对象
  let center = new THREE.Vector3();
  box.getCenter(center);

  // 计算物体宽，高，深（x，y，z）的值
  var size = new THREE.Vector3();
  box.getSize(size);

  return {
    center,
    size,
  };
};
/**
 * @descript 经纬度转坐标
 * @params lng:经度;lat:维度;地球半径
 * @return {} 三维坐标
 */
export const lglt2xyz = (lng: number, lat: number, radius: number) => {
  const theta = (90 + lng) * (Math.PI / 180);
  const phi = (90 - lat) * (Math.PI / 180);
  return new THREE.Vector3().setFromSpherical(
    new THREE.Spherical(radius, phi, theta)
  );
};

/**
 * @description 防抖函数
 * @param func 回调函数
 * @param delay 时间
 * @returns function
 */
export const throttle = (func: Function, delay: number) => {
  delay = delay || 1000;
  let timer: any;
  return (args: any) => {
    let context = this;
    if (!timer) {
      timer = setTimeout(() => {
        func.call(context, args);
        timer = null;
      }, delay);
    }
  };
};

/**
 * @description: 爆炸图动画，全部都是相对于该mesh模型的局部坐标去生成的
 * @param {THREE.Group} mesh 要用于爆炸图的模型
 * @param {string | THREE.Vector3} center 爆炸动画的中心点模型(必须包含在mesh里面)或者坐标；default: (0, 0, 0)
 * @param {"local" | "world"} type 爆炸动画基于哪个坐标系，默认是局部坐标系(推荐)，center是string类型则只考虑局部坐标系；default: 'local'
 * @return {(explpsion: number) => void} 返回值是一个方法，传入数字用于控制爆炸图的程度，根据实际情况而定
 */
export const boom = (
  group: THREE.Group,
  center: string | THREE.Vector3 = new THREE.Vector3(),
  type: "local" | "world" = "local"
): ((explpsion: number) => void) => {
  const centerPos = new THREE.Vector3(); // 储存爆炸中心位置
  // 存储爆炸信息，vector是单位向量，表示方向；length是模型位置与中心点的距离；pos是模型当前的位置
  const map: Map<
    string,
    { vector: THREE.Vector3; length: number; pos: THREE.Vector3 }
  > = new Map();
  // 如果传的是字符串，即模型的名字，就需要在mesh里面包含这个模型，此时一定是局部坐标系
  if (typeof center === "string") {
    try {
      const main = group.getObjectByName(center); // 保持不变的中心物体
      centerPos.copy(main!.position); // 这里是局部坐标
    } catch (error: any) {
      console.log(
        "可能原因为模型名称未在group中找到！",
        error.name,
        ": ",
        error.message
      );
    }
  } else {
    if (type === "local") {
      // 如果是相对于局部坐标系来说，那就直接赋值即可
      centerPos.copy(center);
    } else {
      // 否则，就需要将这个坐标转化成相对于mesh的局部坐标
      centerPos.copy(group.worldToLocal(center.clone()));
    }
  }

  group.traverse((item) => {
    // @ts-ignore
    if (item.isMesh) {
      const pos = new THREE.Vector3().copy(item.position).sub(centerPos);
      map.set(item.uuid, {
        vector: pos.clone().normalize(),
        length: pos.length(),
        pos: item.position.clone(),
      });
    }
  });

  /**
   * @description: 爆炸图模型位置变化
   * @param {number} explosion 应为连续变化的一个数值(放在一个循环里面调用)
   * @return {*}
   */
  const bloomFunc = (explosion: number) => {
    group.traverse((item) => {
      // @ts-ignore
      if (item.isMesh) {
        const curMesh = map.get(item.uuid);
        const pos = curMesh!.pos
          .clone()
          .add(
            curMesh!.vector.clone().multiplyScalar(curMesh!.length * explosion)
          );
        item.position.set(pos.x, pos.y, pos.z);
      }
    });
  };

  return bloomFunc;
};
