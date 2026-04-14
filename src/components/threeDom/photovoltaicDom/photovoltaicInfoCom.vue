<!--
 * @Description: 逆变器的信息展示
 * @Author: caocong “caocong@hopewind.com”
 * @Date: 2024-11-26 13:59:41
 * @LastEditors: caocong “caocong@hopewind.com”
 * @LastEditTime: 2024-12-06 11:34:02
 * @FilePath: \three-wind\src\components\threeDom\infoCom.vue
 * Copyright 2024 Shenzhen Hopewind Electric Co., Ltd, All Rights Reserved. 
-->
<template>
  <el-card class="info-com">
    <div class="title">部件：{{ data.name }}</div>
    <div class="status">状态：{{ data.status }}</div>
    <div class="info">信息：暂无</div>
  </el-card>
</template>

<script lang="ts" setup>
interface Props {
  name: string;
  data: any;
}

defineProps<Props>();
</script>

<style scoped>
.info-com {
  position: absolute;
  bottom: 80px;
  left: -100px;
  width: 200px;
  background: url("@/assets/img/bgImg.jpg") #187990cc no-repeat top center/100%
    100%;
  border: 1px solid rgb(49, 127, 244);
  background-color: rgba(128, 185, 243, 0.8);
}
.title,
.status,
.info {
  color: white;
  text-align: center;
  line-height: 30px;
}
</style>
