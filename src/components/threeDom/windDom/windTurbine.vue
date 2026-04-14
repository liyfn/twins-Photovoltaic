<template>
  <div v-show="!isBoomAni" class="wind-turbine">
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
      <img src="@/assets/img/fengche.png" alt="" />
      <div class="right">
        <div class="device">设备：{{ name }}</div>
        <div class="status">
          状态：<span
            :style="{
              color: enumStatus[conciseData[index].status].color,
            }"
          >
            {{ enumStatus[conciseData[index].status].label }}
          </span>
        </div>
        <div class="status">
          部件：<span class="click-boom" @click="handleAnimation">查看</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import EventBus from "@/utils/eventBus";

interface Props {
  name: string;
  data: any; // 这个后续应该不需要传过来，直接通过接口获取就行了
  index: number;
}
const props = defineProps<Props>();
const conciseData = ref(props.data); // 获取一下传过来的数据
const isWaning = ref(false);
const isDanger = ref(false);
const isDisabled = ref(true);

// 传递过来的data变化，则需要获取需要不要添加波纹提示
watch(
  () => props.data,
  (val) => {
    if (val.value[props.index].status !== 0) {
      if (val.value[props.index].status === 1 && !isDanger.value) {
        // 为 故障，且当前不是故障状态  danger: #f56c6c
        isDanger.value = true;
        isWaning.value = false;
        EventBus.getInstance().emit("addDiffusion", {
          name: props.name,
          type: "danger",
          color: "#ff0000",
          index: props.index,
        });
      } else if (val.value[props.index].status === 2 && !isWaning.value) {
        // 为 告警，且当前不是告警状态  warning：#e6a23c
        isDanger.value = false;
        isWaning.value = true;
        EventBus.getInstance().emit("addDiffusion", {
          name: props.name,
          type: "warning",
          color: "#e6a23c",
          index: props.index,
        });
      }
    } else {
      if (isDanger.value || isWaning.value) {
        isDanger.value = false;
        isWaning.value = false;
        EventBus.getInstance().emit("removeDiffusion", {
          name: props.name,
        });
      }
    }
  },
  {
    immediate: true,
  }
);

const enumStatus = [
  {
    label: "正常",
    value: 0,
    type: "success" as "success",
    color: "rgb(103, 194, 58)",
  },
  {
    label: "故障",
    value: 1,
    type: "danger" as "danger",
    color: "rgb(255, 90, 120)",
  },
  {
    label: "报警",
    value: 2,
    type: "warning" as "warning",
    color: "rgb(255, 170, 69)",
  },
];

const isBoomAni = ref(false); // 播放爆炸图动画时，隐藏全部的标签
const conciseOrDetailed = ref(true);
// 点击标签，状态变换，触发靠近动画
const handleGoClose = () => {
  EventBus.getInstance().emit("goWindCloseOrBack", {
    isClose: true,
    name: props.name,
    index: props.index,
  });
  setTimeout(() => {
    conciseOrDetailed.value = false;
  }, 1000);
};
const handleAnimation = () => {
  EventBus.getInstance().emit("boomAniOrBack", {
    isStart: true,
    name: "boomAni" + props.index, // 针对每个风机有不同的爆炸图动画名字，便于区分
    index: props.index,
  });
};
// 监听：靠近或远离风机的动画事件
EventBus.getInstance().on("goWindCloseOrBack", ({ isClose }) => {
  // 靠近时，所有的div都应该是禁用状态
  if (isClose) isDisabled.value = true;
  else {
    // 远离时，由详情展示变成粗略展示，1s后，可以再次点击
    conciseOrDetailed.value = true;
    setTimeout(() => {
      isDisabled.value = false;
    }, 1000);
  }
});
// 入场动画结束后，取消点击禁用
EventBus.getInstance().on("entryAnimationOrEnd", ({ isStart }) => {
  if (!isStart) isDisabled.value = false;
});
// 巡检动画开始时禁用按钮，结束时启用按钮
EventBus.getInstance().on("inspectionStartOrEnd", (val) => {
  isDisabled.value = val ? true : false;
});
</script>

<style scoped lang="scss">
.wind-turbine {
  pointer-events: none;
  position: absolute;
  bottom: 10px;
  left: -125px;
  width: 250px;
  box-sizing: border-box;
  & .title {
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border: 1px solid rgb(49, 127, 244);
    background-color: rgba(128, 185, 243, 0.7);
    font-size: 20px;
    line-height: 30px;
    padding: 5px 10px;
    .click-detail {
      pointer-events: auto;
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
    padding: 15px;
    & img {
      width: 60px;
      height: 70px;
    }
    & .right {
      font-size: 14px;
      line-height: 25px;
      margin-left: 10px;
      .click-boom {
        cursor: pointer;
        color: rgb(49, 49, 145);
      }
    }
  }
}
</style>
