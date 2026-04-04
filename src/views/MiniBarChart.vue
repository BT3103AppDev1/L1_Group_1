<template>
  <svg width="100%" :height="svgHeight" :viewBox="'0 0 ' + chartWidth + ' ' + svgHeight" style="overflow:visible;">
    <g v-for="(d, i) in data" :key="i">
      <rect
        :x="i * (barWidth * 2 + gap * 2) + gap"
        :y="height - (d.personal / maxVal) * height"
        :width="barWidth"
        :height="(d.personal / maxVal) * height"
        rx="4" fill="#0FA878" opacity="0.9"
      />
      <rect
        :x="i * (barWidth * 2 + gap * 2) + gap + barWidth + 3"
        :y="height - (d.cpi / maxVal) * height"
        :width="barWidth"
        :height="(d.cpi / maxVal) * height"
        rx="4" fill="#D1D5DB" opacity="0.7"
      />
      <text
        :x="i * (barWidth * 2 + gap * 2) + gap + barWidth"
        :y="height + 18"
        text-anchor="middle" font-size="10" fill="#9CA3AF" font-family="DM Sans"
      >{{ d.month }}</text>
    </g>
  </svg>
</template>

<script>
export default {
  name: 'MiniBarChart',
  props: {
    data: { type: Array, required: true },
    height: { type: Number, default: 140 },
    barWidth: { type: Number, default: 28 },
    gap: { type: Number, default: 8 },
  },
  computed: {
    maxVal() { return Math.max(...this.data.map(d => Math.max(d.personal, d.cpi))) },
    chartWidth() { return this.data.length * (this.barWidth * 2 + this.gap * 2) + this.gap },
    svgHeight() { return this.height + 30 },
  },
}
</script>
