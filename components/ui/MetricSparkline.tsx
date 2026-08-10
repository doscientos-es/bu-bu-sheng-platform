"use client";

import type { ECharts, EChartsOption } from "echarts";
import * as echarts from "echarts";
import { useEffect, useRef } from "react";

type MetricSparklineProps = {
  trend: "down" | "up";
};

const SPARKLINE_DATA = {
  up: [12, 17, 15, 28, 22, 34, 29],
  down: [29, 23, 27, 16, 22, 17, 24],
};

const SPARKLINE_COLORS = {
  up: { line: "#29a36a", area: "rgb(41 163 106 / 24%)" },
  down: { line: "#e06b64", area: "rgb(224 107 100 / 23%)" },
};

export function MetricSparkline({ trend }: MetricSparklineProps) {
  const chartElement = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = chartElement.current;
    if (!element) return;

    const chart: ECharts = echarts.init(element, undefined, { renderer: "svg" });
    const colors = SPARKLINE_COLORS[trend];
    const options: EChartsOption = {
      animationDuration: 450,
      animationEasing: "cubicOut",
      grid: { top: 1, right: 1, bottom: 1, left: 1 },
      xAxis: { type: "category", boundaryGap: false, show: false },
      yAxis: { type: "value", show: false },
      series: [
        {
          type: "line",
          data: SPARKLINE_DATA[trend],
          smooth: 0.45,
          symbol: "none",
          silent: true,
          lineStyle: { color: colors.line, width: 2 },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: colors.area },
              { offset: 1, color: "rgb(255 255 255 / 0%)" },
            ]),
          },
        },
      ],
    };

    chart.setOption(options);
    const resizeObserver = new ResizeObserver(() => chart.resize());
    resizeObserver.observe(element);

    return () => {
      resizeObserver.disconnect();
      chart.dispose();
    };
  }, [trend]);

  return <div ref={chartElement} className="metric-sparkline" aria-hidden="true" />;
}
