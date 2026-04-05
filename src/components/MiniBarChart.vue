<template>
  <!-- SVG chart, overflow:visible allows labels to render outside the viewBox -->
  <svg width="100%" :height="svgHeight" :viewBox="'0 0 ' + chartWidth + ' ' + svgHeight" style="overflow:visible;">
    
    <!-- Zero baseline, dashed horizontal line at the vertical midpoint -->
    <line 
      :x1="0" :y1="zeroY" 
      :x2="chartWidth" :y2="zeroY" 
      stroke="#E5E7EB" stroke-width="1" stroke-dasharray="4" 
    />

    <g v-for="(d, i) in data" :key="i">

      <!-- Personal inflation bar, red if above CPI, green if below -->
      <rect
        :x="i * (barWidth * 2 + gap * 2) + gap"
        :y="d.personal >= 0 ? zeroY - Math.abs(getY(d.personal)) : zeroY"
        :width="barWidth"
        :height="Math.max(Math.abs(getY(d.personal)), 2)"
        rx="4" 
        :fill="d.personal > (d.cpi ?? 0) ? '#EF4444' : '#0FA878'" 
        opacity="0.9"
      />
      
      <!-- Official CPI bar, shown in grey when data is available -->
      <rect
        v-if="d.cpi !== null"
        :x="i * (barWidth * 2 + gap * 2) + gap + barWidth + 3"
        :y="d.cpi >= 0 ? zeroY - Math.abs(getY(d.cpi)) : zeroY"
        :width="barWidth"
        :height="Math.max(Math.abs(getY(d.cpi)), 2)"
        rx="4" 
        fill="#D1D5DB" 
        opacity="0.7"
      />

      <!-- Official CPI bar, dashed outline shown when no CPI data exists for that month -->
      <rect
        v-else
        :x="i * (barWidth * 2 + gap * 2) + gap + barWidth + 3"
        :y="zeroY - 20"
        :width="barWidth"
        :height="20"
        rx="4"
        fill="none"
        stroke="#D1D5DB"
        stroke-width="1"
        stroke-dasharray="3,2"
        opacity="0.6"
      />

      <!-- Month label below each bar pair -->
      <text
        :x="i * (barWidth * 2 + gap * 2) + gap + barWidth"
        :y="height + 25"
        text-anchor="middle" font-size="10" fill="#9CA3AF"
        style="font-family: var(--font-body)"
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
    // Largest absolute value across all personal and CPI values.
    // Used to scale bar heights relative to the chart area.
    // Includes 20% headroom so the tallest bar doesn't touch the top edge.
    maxAbsVal() {
      // Collects all numbers, ignoring nulls
      const vals = this.data.flatMap(d => [
        d.personal !== null ? Math.abs(d.personal) : 0,
        d.cpi !== null ? Math.abs(d.cpi) : 0
      ])
      const max = Math.max(...vals, 1)
      return max * 1.2 // 20% headroom
    },

    // Y coordinate of the zero baseline — vertically centered to support negative bars
    zeroY() {
      // Centers the baseline to allow for deflation (negative bars)
      return this.height / 2
    },

    // Total SVG width based on the number of data points and bar/gap sizes
    chartWidth() { 
      return this.data.length * (this.barWidth * 2 + this.gap * 2) + this.gap 
    },

    // Total SVG height including space below the chart for month labels
    svgHeight() { 
      return this.height + 40 
    },
  },
  methods: {
    // Converts a data value to a pixel height relative to the chart area.
    // Returns 0 for null values so missing data renders as a zero-height bar.
    getY(val) {
      if (val === null) return 0
      return (val / this.maxAbsVal) * (this.height / 2)
    }
  }
}
</script>