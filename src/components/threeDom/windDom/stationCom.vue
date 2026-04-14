<!--
 * @Description: 升压站的DOM
 * @Author: caocong “caocong@hopewind.com”
 * @Date: 2024-12-06 16:18:48
 * @LastEditors: caocong “caocong@hopewind.com”
 * @LastEditTime: 2024-12-20 15:51:38
 * @FilePath: \three-wind\src\components\threeDom\stationCom.vue
 * Copyright 2024 Shenzhen Hopewind Electric Co., Ltd, All Rights Reserved. 
-->
<template>
  <div class="station">
    <div class="title">
      <span>{{ name }}</span>
      <el-button type="primary" class="click-detail" disabled> 详情 </el-button>
    </div>
  </div>
</template>

<script lang="ts" setup>
interface Props {
  name: string;
}
defineProps<Props>();
</script>

<style scoped lang="scss">
.station {
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
    background-color: rgba(128, 185, 243, 0.8);
    font-size: 20px;
    line-height: 30px;
    padding: 5px 10px;
  }
}
</style>
