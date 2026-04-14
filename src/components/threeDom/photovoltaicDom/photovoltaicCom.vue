<!--
 * @Description: 每个光伏块的标志
 * @Author: caocong “caocong@hopewind.com”
 * @Date: 2024-12-10 13:20:03
 * @LastEditors: caocong “caocong@hopewind.com”
 * @LastEditTime: 2025-02-11 17:51:29
 * @FilePath: \digital_twins2\src\components\threeDom\photovoltaicDom\photovoltaicCom.vue
 * Copyright 2024 Shenzhen Hopewind Electric Co., Ltd, All Rights Reserved. 
-->
<template>
  <div v-show="!isBoomAni" class="photovoltaic">
    <div v-if="conciseOrDetailed" class="title">
      <span>{{ name }}</span>
      <el-button
        :type="enumStatus[conciseData[index].status].type"
        @click="handleGoClose"
        class="click-detail"
        :disabled="isDisabled"
      >
        详情
      </el-button>
    </div>
    <div v-else class="detail">
      <img src="@/assets/img/photovoltaic.jpg" alt="" />
      <div class="right">
        <div class="device">名称：{{ name }}</div>
        <div class="status">
          数采状态：<span
            :style="{
              color: enumStatus[conciseData[index].status].color,
            }"
          >
            {{ enumStatus[conciseData[index].status].label }}
          </span>
        </div>
        <div class="status">
          逆变器：<span class="click-boom" @click="handleAnimation">查看</span>
        </div>
        <div class="status">
          组串：
          <span
            :class="
              curPanelRow > 1 && !isSweeping ? 'click-sweep' : 'click-disable'
            "
            @click="handleSubCurRow"
          >
            -
          </span>
          {{ curPanelRow }}
          <span
            :class="
              curPanelRow < 7 && !isSweeping ? 'click-sweep' : 'click-disable'
            "
            @click="handleAddCurRow"
          >
            +
          </span>
          <span class="click-boom" @click="handlePanelSeriesSweep">
            {{ isSweeping ? "停止" : "扫描" }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import EventBus from "@/utils/eventBus";
import { Vector3 } from "three";

interface Props {
  name: string;
  data: any; // 这个后续应该不需要传过来，直接通过接口获取就行了
  index: number;
  mesh: any; // 这个是光伏块的模型
}
const props = defineProps<Props>();

watch(
  () => props.data,
  () => {
    nextTick(() => {
      calDiffusionPos();
    });
  },
  { immediate: true }
);

const conciseData = ref(props.data); // 获取一下传过来的数据
const isDisabled = ref(true); // 是否禁用按钮
const isBoomAni = ref(false); // 播放逆变器动画时，隐藏全部的标签
const conciseOrDetailed = ref(true); // 显示详细还是简略信息

const curPanelRow = ref(1); // 记录当前的行，靠近逆变器的是第一行
const isSweeping = ref(false); // 记录当前是否正在扫描状态

type btnType = "success" | "danger" | "warning";
const enumStatus = [
  {
    label: "正常",
    value: 0,
    type: "success" as btnType,
    color: "rgb(103, 194, 58)",
  },
  {
    label: "故障",
    value: 1,
    type: "danger" as btnType,
    color: "rgb(255, 90, 120)",
  },
  {
    label: "报警",
    value: 2,
    type: "warning" as btnType,
    color: "rgb(255, 170, 69)",
  },
];

// 点击标签，状态变换，触发靠近动画
const handleGoClose = () => {
  EventBus.getInstance().emit("goPhotovoltaicCloseOrBack", {
    isClose: true,
    name: props.name,
    index: props.index,
  });
  setTimeout(() => {
    conciseOrDetailed.value = false;
  }, 1000);
};
// 点击查看逆变器
const handleAnimation = () => {
  EventBus.getInstance().emit("goInverterCloseOrBack", true);
  isSweeping.value = false;
  EventBus.getInstance().emit("panelSeriesSweep", {
    index: props.index, // 记录当前是第几个光伏方阵
    row: curPanelRow.value, // 第几行要进行扫描
    state: isSweeping.value, // 这里是变化后的状态
  });
};

EventBus.getInstance().on("entryAnimationOrEnd", ({ isStart }) => {
  if (!isStart) isDisabled.value = false;
});
EventBus.getInstance().on("inspectionStartOrEnd", (val) => {
  isDisabled.value = val ? true : false;
});

EventBus.getInstance().on("goPhotovoltaicCloseOrBack", ({ isClose }) => {
  if (isClose) isDisabled.value = true;
  if (!isClose) {
    conciseOrDetailed.value = true;
    setTimeout(() => {
      isDisabled.value = false;
    }, 1000);
  }
});

EventBus.getInstance().on("goOrBackDroneFollow", (val) => {
  if (val) isDisabled.value = true;
  else {
    setTimeout(() => {
      isDisabled.value = false;
    }, 2000);
  }
});
// 计算应该添加 地震波 的位置
const scale = 29; // 这个是模型的放大倍数
const rowDis = 12; // 行间距
const columnDis = 15; // 列间距
const center = [4, 4]; // 中心点在4行4列
const calDiffusionPos = () => {
  // 如果传过来的数据没有 position 或者 长度为 0，则不需要添加
  if (!props.data.value[props.index].position?.length) return;
  // 获取中心点的位置，作为坐标原点
  const centerMesh = props.mesh.getObjectByName(
    `HTMLTagEmpty${props.index + 1}`
  );
  const dir = new Vector3();
  centerMesh.getWorldPosition(dir);
  props.data.value[props.index].position.forEach(
    (pos: [number, number], index: number) => {
      const x = (pos[0] - center[0]) * rowDis * scale + dir.x;
      const z = (pos[1] - center[1]) * columnDis * scale + dir.z;
      // 计算当前的位置
      const curDiffPos = [x, -10, z];
      const curWorkPos = [x, 250, z];
      // 添加地震波
      EventBus.getInstance().emit("addPhotovoltaicDiffusion", {
        name: pos.toString() + props.name,
        type: "danger",
        color: 0xff0000,
        pos: curDiffPos,
        rotateNegative: 1,
      });
      // 添加对应的工况Svg
      EventBus.getInstance().emit(`addPhotovoltaicWorkCondition`, {
        name: pos.toString() + props.name,
        type: props.data.value[props.index].type[index],
        pos: curWorkPos,
      });
    }
  );
};

// 更改要扫描的行 范围1-7
const handleSubCurRow = () => {
  if (!isSweeping.value) {
    if (curPanelRow.value <= 1) return;
    curPanelRow.value--;
  }
};
const handleAddCurRow = () => {
  if (!isSweeping.value) {
    if (curPanelRow.value >= 7) return;
    curPanelRow.value++;
  }
};
// 触发事件：开始/停止扫描事件
const handlePanelSeriesSweep = () => {
  if (isSweeping.value) {
    // 正在扫描状态，点击停止扫描
    isSweeping.value = false;
  } else {
    // 停止状态，点击开始扫描
    isSweeping.value = true;
  }
  EventBus.getInstance().emit("panelSeriesSweep", {
    index: props.index, // 记录当前是第几个光伏方阵
    row: curPanelRow.value, // 第几行要进行扫描
    state: isSweeping.value, // 这里是变化后的状态
  });
};
</script>

<style scoped lang="scss">
.photovoltaic {
  pointer-events: none;
  position: absolute;
  bottom: 10px;
  left: -90px;
  width: 180px;
  box-sizing: border-box;
  & .title {
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 200px;
    background-color: rgba(157, 197, 245, 0.7);
    border: 1px solid rgb(49, 127, 244);
    font-size: 16px;
    line-height: 25px;
    padding: 5px 10px;
    .click-detail {
      pointer-events: auto;
      height: 25px;
    }
  }

  .detail {
    position: relative;
    pointer-events: auto;
    background-color: rgba(157, 197, 245, 0.7);
    border: 1px solid rgb(49, 127, 244);
    display: flex;
    justify-content: space-around;
    align-items: center;
    padding: 5px;
    & img {
      width: 50px;
      height: 50px;
    }
    & .right {
      font-size: 10px;
      line-height: 18px;
      .click-boom {
        cursor: pointer;
        color: rgb(49, 49, 145);
      }
      .click-sweep {
        cursor: pointer;
        color: rgb(49, 49, 145);
      }
      .click-disable {
        cursor: not-allowed;
        color: gray;
      }
    }
  }
}
.back-button {
  position: absolute;
  right: 5px;
  top: 5px;
  color: var(--el-color-primary);
}
</style>
