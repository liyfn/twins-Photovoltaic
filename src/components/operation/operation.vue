<template>
  <div class="operation-icon">
    <!-- 全屏，点击全屏，且将侧边栏隐藏 -->
    <el-icon class="item active" @click="toggle">
      <FullScreen v-if="!isFullscreen" />
      <Rank v-else />
    </el-icon>
    <!-- 设置项，供用户手动设置一些初始状态 -->
    <el-popover
      :width="200"
      popper-style="backgroundColor: rgba(128, 185, 243, 0.5); border: none;"
    >
      <template #reference>
        <el-icon class="item active">
          <Setting />
        </el-icon>
      </template>
      <template #default>
        <p>
          <span class="text">入场巡检：</span>
          <el-checkbox
            v-model="state.isAutoInspect"
            @change="handelChangeInspect"
          />
        </p>
        <p>
          <span class="text">巡检半径：</span>
          <el-input
            v-model="state.changeRadius"
            :disabled="state.isInspectionGoing"
            style="width: 80px"
            type="number"
            @blur="handleChangeRadius"
          />
        </p>
        <p v-if="props.type === 'wind'">
          <span class="text">风力等级：</span>
          <el-input
            v-model="state.windSpeed"
            style="width: 80px"
            type="number"
            :min="1"
            :max="10"
            @blur="handleChangeWindSpeed"
          />
        </p>
        <p v-if="props.type === 'photovoltaic'">
          <span class="text">无人机巡查：</span>
          <el-checkbox v-model="state.isShowDrone" @change="handelShowDrone" />
        </p>
        <p v-if="props.type === 'photovoltaic'">
          <span class="text">无人机路径：</span>
          <el-checkbox
            v-model="state.isShowDronePath"
            @change="handelShowDronePath"
          />
        </p>
        <p v-if="props.type === 'photovoltaic'">
          <span class="text"> 工况显示：</span>
          <el-checkbox v-model="state.isShowWork" @change="handelShowWork" />
        </p>
      </template>
    </el-popover>
    <!-- 天气系统，点击后要出现一个选择区域 -->
    <el-popover
      :width="160"
      popper-style="backgroundColor: rgba(128, 185, 243, 0.5); border: none;"
    >
      <template #reference>
        <el-icon class="item active">
          <Sunny />
        </el-icon>
      </template>
      <template #default>
        <div style="display: flex; gap: 16px" class="weather-content">
          <div class="time-period">
            <div
              v-for="(item, index) in timeArray"
              :key="item.key"
              :class="['item', timeActive === index ? 'active' : '']"
              @click="handleClickTime(item.key, index)"
            >
              <img :src="item.path" alt="" />
            </div>
          </div>
          <div class="weather">
            <div
              v-for="(item, index) in weatherArray"
              :key="item.key"
              :class="['item', weatherActive === index ? 'active' : '']"
              @click="handleClickWeather(item.key, index)"
            >
              <img :src="item.path" alt="" />
            </div>
            <!-- <div
              v-if="isWindModel"
              :class="['item', weatherActive === 2 ? 'active' : '']"
              @click="handleClickWeather('wind', 2)"
            >
              <img src="@/assets/svg/wind.svg" alt="" />
            </div> -->
            <div
              v-if="!isWindModel"
              :class="['item', weatherActive === 2 ? 'active' : '']"
              @click="handleClickWeather('overcast', 2)"
            >
              <img src="@/assets/svg/overcast.svg" alt="" />
            </div>
          </div>
        </div>
      </template>
    </el-popover>
    <!-- 巡检，点击自动巡检 -->
    <el-icon
      :class="[
        'item',
        state.isShowInspection ? 'active' : '',
        state.isInspectionGoing ? 'click' : '',
      ]"
      @click="goInspection"
    >
      <Guide />
    </el-icon>
    <!-- 无人机第一人称漫游 -->
    <el-icon
      v-if="state.isDroneFollow"
      :class="['item', 'active', state.isFirstPerson ? 'click' : '']"
      @click="handelFreeTravel"
    >
      <Position />
    </el-icon>
    <!-- 标签显示和隐藏的功能 -->
    <el-icon
      :class="['item', !state.isHideDisabled ? 'active' : '']"
      @click="handleHideAllTag"
    >
      <View v-if="state.isHideAllTag" />
      <Hide v-else />
    </el-icon>
    <!-- 返回，返回到上一个操作 -->
    <!-- 风电的返回 -->
    <el-icon
      v-if="props.type === 'wind'"
      :class="[
        'item',
        state.isShowWindBack || state.isShowWindBoomBack ? 'active' : '',
      ]"
      @click="goWindBack"
    >
      <Back />
    </el-icon>
    <!-- 光伏的返回 -->
    <el-icon
      v-if="props.type === 'photovoltaic' || props.type === 'tech'"
      :class="[
        'item',
        state.isShowPhotoBack ||
        state.isShowPhotoInverterBack ||
        state.isShowBackFirstPerson
          ? 'active'
          : '',
      ]"
      @click="goPhotovoltaicBack"
    >
      <Back />
    </el-icon>
  </div>
</template>

<script lang="ts" setup>
import { useFullscreen } from "@vueuse/core";
import EventBus from "@/utils/eventBus";
import { useSettingStore } from "@/store/setting";

const setting = useSettingStore();

interface Props {
  type: "wind" | "photovoltaic" | "tech";
}
const props = withDefaults(defineProps<Props>(), {
  type: "wind",
});

const isWindModel = ref(false);
const { isFullscreen, toggle } = useFullscreen();
// 存储所有的状态
const state: { [name: string]: any } = ref({
  isShowWindBack: false, // 是否显示风电的返回按钮
  isShowWindBoomBack: false, // 是否显示风电爆炸图的返回按钮
  isHideAllTag: false, // 是否隐藏所有的HTML标签
  isHideDisabled: false, // 是否禁用标签隐藏(进入爆炸图需要)
  isShowPhotoBack: false, // 是否显示光伏方阵 -> 外侧的返回按钮
  isShowPhotoInverterBack: false, // 是否显示逆变器 -> 光伏方阵的返回按钮
  isShowInspection: false, // 是否显示巡检按钮
  isInspectionGoing: true, // 是巡检是否正在进行中
  isShowBackFirstPerson: false, // 是否显示无人机第一视角跟随模式的返回按钮
  isAutoInspect: true, // 入场动画结束后，是否自动巡检，pinia持久胡
  isShowDrone: true, // 光伏是否显示无人机巡查
  isDroneFollow: false, // 是否点击了无人机，进入视角跟随状态
  isFirstPerson: false, // 无人机巡查过程中是否进行第一人称漫游
  isShowDronePath: false, // 是否显示无人机巡查路线
  changeRadius: 60, // 当前巡检的半径
  isShowWork: true, // 是否显示光伏方阵目前存在的工况，默认显示
  windSpeed: 2, // 控制风速，范围1-10
});
// 初始化入场后是否自动巡检
state.value.isInspectionGoing = setting.isAutoInspect;

// ———————————————————— setting设置内容 ————————————————————
// 判断是否自动巡检
state.value.isAutoInspect = setting.isAutoInspect;
const handelChangeInspect = () => {
  setting.setIsAutoInspect(state.value.isAutoInspect);
};
// 修改巡检半径长度
state.value.changeRadius = setting.radius;
const handleChangeRadius = () => {
  if (state.value.changeRadius === setting.radius) return;
  else setting.setRadius(state.value.changeRadius);
};
// 是否显示无人机巡查
state.value.isShowDrone = setting.isShowDrone;
const handelShowDrone = () => {
  nextTick(() => {
    setting.setShowDrone(state.value.isShowDrone);
  });
};

// ———————————————————— 公共事件监听 ————————————————————
// 判断当前是否是风电场景，默认false
EventBus.getInstance().on("windModel", () => {
  isWindModel.value = true;
});
// 入场动画是否结束监听
EventBus.getInstance().on("entryAnimationOrEnd", ({ isStart }) => {
  if (!isStart) state.value.isShowInspection = true;
});
// ———————————————————— 风电场景事件监听 ————————————————————
// 监听靠近 远离 风机事件
EventBus.getInstance().on("goWindCloseOrBack", ({ isClose }) => {
  if (isClose) {
    state.value.isShowInspection = false;
    setTimeout(() => {
      state.value.isShowWindBack = true;
    }, 1000);
  } else {
    state.value.isShowInspection = true;
  }
});
// 监听爆炸动画开始和结束事件
EventBus.getInstance().on("boomAniOrBack", ({ isStart }) => {
  if (isStart) {
    state.value.isHideDisabled = true;
    state.value.isShowWindBack = false; // 爆炸图开始时返回按钮不可用
    setTimeout(() => {
      state.value.isShowWindBoomBack = true;
    }, 2000);
  }
});
// 改变风场的风速，同步改变海水流速和风机转速
const handleChangeWindSpeed = () => {
  EventBus.getInstance().emit("changeWindSpeed", state.value.windSpeed);
};
// ———————————————————— 光伏场景事件监听 ————————————————————
// 靠近 远离 光伏方阵事件监听
EventBus.getInstance().on("goPhotovoltaicCloseOrBack", ({ isClose }) => {
  if (isClose) {
    state.value.isShowInspection = false;
    state.value.isShowWork = false;
    setTimeout(() => {
      state.value.isShowPhotoBack = true;
    }, 1000);
  } else {
    state.value.isShowInspection = true;
    state.value.isShowWork = true;
  }
  handelShowWork();
});
// 靠近 远离 光伏方阵逆变器事件监听
EventBus.getInstance().on("goInverterCloseOrBack", (val) => {
  if (val) {
    state.value.isHideDisabled = true;
    state.value.isShowPhotoBack = false;
    setTimeout(() => {
      state.value.isShowPhotoInverterBack = true;
    }, 1000);
  }
});
// 是否显示工况
const handelShowWork = () => {
  EventBus.getInstance().emit("hiddenOrShowWork", state.value.isShowWork);
};
// 监听点击无人机事件
EventBus.getInstance().on("goOrBackDroneFollow", (val) => {
  // TODO: 标签不可点击
  if (val) {
    state.value.isShowInspection = false;
    setTimeout(() => {
      state.value.isShowBackFirstPerson = true;
      state.value.isDroneFollow = true;
    }, 2000);
  }
});
// 是否启动第一人称漫游（不需要存储状态）
const handelFreeTravel = () => {
  // 开启后，应该让无人机停止运动，关闭后(或者返回后)，在继续运动
  state.value.isFirstPerson = !state.value.isFirstPerson;
  EventBus.getInstance().emit("settingShowDrone", !state.value.isFirstPerson);
  EventBus.getInstance().emit("freeTravel", state.value.isFirstPerson);
};
// 是否显示无人机巡查的路径
state.value.isShowDronePath = setting.isShowDronePath;
const handelShowDronePath = () => {
  nextTick(() => {
    setting.setShowDronePath(state.value.isShowDronePath);
  });
};

// ———————————————— 按钮的点击事件 ————————————————
// 点击风电的返回按钮触发 远离 或 爆炸图返回 动画
const goWindBack = () => {
  if (state.value.isShowWindBack) {
    // 靠近动画的返回事件
    // 点击返回按钮，状态变化，触发离开动画
    state.value.isShowWindBack = false;
    EventBus.getInstance().emit("goWindCloseOrBack", { isClose: false });
  } else if (state.value.isShowWindBoomBack) {
    // 爆炸图动画的返回事件，爆炸图本身的返回不可用，动画结束后靠近动画的返回按钮可用
    EventBus.getInstance().emit("boomAniOrBack", { isStart: false });
    state.value.isShowWindBoomBack = false;
    setTimeout(() => {
      state.value.isShowWindBack = true;
      state.value.isHideDisabled = false;
    }, 2000);
  }
};
// 点击光伏的返回按钮，触发 远离 或逆变器远离 或 无人机返回 动画
const goPhotovoltaicBack = () => {
  if (state.value.isShowPhotoBack) {
    state.value.isShowPhotoBack = false;
    EventBus.getInstance().emit("goPhotovoltaicCloseOrBack", {
      isClose: false,
    });
  } else if (state.value.isShowPhotoInverterBack) {
    state.value.isShowPhotoInverterBack = false;
    EventBus.getInstance().emit("goInverterCloseOrBack", false);
    setTimeout(() => {
      state.value.isShowPhotoBack = true;
      state.value.isHideDisabled = false;
    }, 1000);
  }
  if (state.value.isShowBackFirstPerson) {
    EventBus.getInstance().emit("goOrBackDroneFollow", false);
    state.value.isShowBackFirstPerson = false;
    // 退出了无人机视角跟随状态
    state.value.isDroneFollow = false;
    // 如果此时是第一人称漫游，则退出该模式
    if (state.value.isFirstPerson) handelFreeTravel();

    setTimeout(() => {
      // TODO: 标签恢复点击
      state.value.isShowInspection = true;
    }, 2000);
  }
};
// 点击巡检按钮，触发 或 停止 巡检事件
const goInspection = () => {
  if (state.value.isShowInspection) {
    state.value.isInspectionGoing = !state.value.isInspectionGoing;
    EventBus.getInstance().emit(
      "inspectionStartOrEnd",
      state.value.isInspectionGoing
    );
  }
};
// 点击 隐藏/显示 全部的标签
const handleHideAllTag = () => {
  if (!state.value.isHideDisabled) {
    // 在出现返回时，说明标签必须是隐藏状态，此时不应该触发
    EventBus.getInstance().emit("HideOrShowMainTag", state.value.isHideAllTag);
    state.value.isHideAllTag = !state.value.isHideAllTag;
  }
};
// ———————————————— 时间和天气的点击事件 ————————————————
const weatherArray = [
  {
    // 下雨，环境光变弱；太阳光(平行光)变弱；出现雨点
    name: "下雨",
    key: "rain",
    path: new URL("@/assets/svg/rain.svg", import.meta.url).href,
  },
  {
    // 下雪，太阳光(平行光)变弱；出现雪花
    name: "下雪",
    key: "snow",
    path: new URL("@/assets/svg/snow.svg", import.meta.url).href,
  },
  {
    // 下雪，太阳光(平行光)变弱；出现雪花
    name: "大雾",
    key: "smoke",
    path: new URL("@/assets/svg/smoke_weather.svg", import.meta.url).href,
  },
];
const weatherActive = ref(-1);
// 点击更改对应的天气，再次点击回到初始状态
const handleClickWeather = (key: string, index: number) => {
  weatherActive.value = weatherActive.value === index ? -1 : index;
  const weather = weatherActive.value === -1 ? "normal" : key;
  EventBus.getInstance().emit("clickWeather", weather);
};

const timeArray = [
  {
    name: "早晨",
    key: "morning",
    path: new URL("@/assets/svg/morning.svg", import.meta.url).href,
  },
  {
    name: "正午",
    key: "noon",
    path: new URL("@/assets/svg/noon.svg", import.meta.url).href,
  },
  {
    name: "傍晚",
    key: "evening",
    path: new URL("@/assets/svg/evening.svg", import.meta.url).href,
  },
];
const timeActive = ref(0);
// 点击更改对应的事件，默认是傍晚状态
const handleClickTime = (key: string, index: number) => {
  timeActive.value = index;
  EventBus.getInstance().emit("clickTimeSys", key);
};
</script>

<style scoped lang="scss">
.operation-icon {
  width: 300px;
  height: 60px;
  display: flex;
  justify-content: center;
  align-items: center;
  .item {
    flex: 1;
    font-size: 24px;
    color: rgb(199.5, 201, 204);
    cursor: not-allowed;
  }
  .item.active {
    cursor: pointer;
    color: black;
  }
  .item.click {
    color: #409eff;
  }
}
.text {
  color: black;
  font-weight: bold;
  line-height: 40px;
}
.weather-content {
  display: flex;
  .weather,
  .time-period {
    display: flex;
    flex-direction: column;
    justify-content: center;
    & .item {
      flex: 1;
      cursor: pointer;
      & img {
        width: 30px;
        margin: 15px;
      }
    }
    & .item.active img {
      scale: 1.5;
    }
  }
}
</style>
