<template>
  <span :class="['badge', badgeClass]">
    <span class="badge-dot"></span>
    <slot>{{ status }}</slot>
  </span>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  status: {
    type: String,
    default: 'MEDIUM'
  }
});

const badgeClass = computed(() => {
  const s = props.status?.toUpperCase();
  if (s === 'CRITICAL' || s === 'DANGER' || s === 'PANICKED') return 'badge-critical';
  if (s === 'HIGH' || s === 'WARNING' || s === 'DISTRESSED') return 'badge-high';
  if (s === 'SAFE' || s === 'RESOLVED' || s === 'AVAILABLE') return 'badge-success';
  return 'badge-medium';
});
</script>

<style scoped>
.badge-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: currentColor;
}
</style>
