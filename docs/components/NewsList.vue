<script setup>
import { computed } from 'vue'
import { withBase } from 'vitepress'
import newsData from '../.vitepress/news.json'

const props = defineProps({
  limit: {
    type: Number,
    default: 0
  }
})

const displayNews = computed(() => {
  return props.limit > 0 ? newsData.slice(0, props.limit) : newsData
})
</script>

<template>
  <ul class="news-list">
    <li v-for="(item, index) in displayNews" :key="index">
      <strong>{{ item.date }}:</strong>
      <a v-if="item.link" :href="withBase(item.link)">{{ item.text }}</a>
      <span v-else>{{ item.text }}</span>
    </li>
  </ul>
</template>

<style scoped>
.news-list {
  list-style-type: none;
  padding-left: 0;
  margin-top: 1rem;
}
.news-list li {
  position: relative;
  padding-left: 1.5rem;
  margin-bottom: 0.5rem;
}
.news-list li::before {
  content: "-";
  position: absolute;
  left: 0;
  color: var(--vp-c-text-1);
}
</style>
