<template>
    <svg width="100%" :height="svgHeight" :viewBox="'0 0 ' + chartWidth + ' ' + svgHeight" style="overflow:visible;">
      <line 
        :x1="0" :y1="zeroY" 
        :x2="chartWidth" :y2="zeroY" 
        stroke="#E5E7EB" stroke-width="1" stroke-dasharray="4" 
      />
  
      <g v-for="(d, i) in data" :key="i">
        <rect
          :x="i * (barWidth * 2 + gap * 2) + gap"
          :y="d.personal >= 0 ? zeroY - Math.abs(getY(d.personal)) : zeroY"
          :width="barWidth"
          :height="Math.max(Math.abs(getY(d.personal)), 2)"
          rx="4" 
          :fill="d.personal > (d.cpi ?? 0) ? '#EF4444' : '#0FA878'" 
          opacity="0.9"
        />
        
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
      maxAbsVal() {
        // Collects all numbers, ignoring nulls
        const vals = this.data.flatMap(d => [
          d.personal !== null ? Math.abs(d.personal) : 0,
          d.cpi !== null ? Math.abs(d.cpi) : 0
        ])
        const max = Math.max(...vals, 1)
        return max * 1.2 // 20% headroom
      },
      zeroY() {
        // Centers the baseline to allow for deflation (negative bars)
        return this.height / 2
      },
      chartWidth() { 
        return this.data.length * (this.barWidth * 2 + this.gap * 2) + this.gap 
      },
      svgHeight() { 
        return this.height + 40 
      },
    },
    methods: {
      getY(val) {
        if (val === null) return 0
        return (val / this.maxAbsVal) * (this.height / 2)
      }
    }
  }
  </script>