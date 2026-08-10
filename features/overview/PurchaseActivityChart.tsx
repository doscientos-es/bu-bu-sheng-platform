"use client";

import type { ECharts, EChartsOption } from "echarts";
import * as echarts from "echarts";
import { useEffect, useRef } from "react";

type PurchaseActivityChartProps = {
  values: number[];
  weekdays: string[];
};

export function PurchaseActivityChart({ values, weekdays }: PurchaseActivityChartProps) {
  const chartElement = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = chartElement.current;
    if (!element) return;

    const peakIndex = values.indexOf(Math.max(...values));
    const chart: ECharts = echarts.init(element, undefined, { renderer: "svg" });
    const regularBar = new echarts.graphic.LinearGradient(0, 0, 0, 1, [
      { offset: 0, color: "#a8aed3" },
      { offset: 1, color: "#e5e7f4" },
    ]);
    const peakBar = new echarts.graphic.LinearGradient(0, 0, 0, 1, [
      { offset: 0, color: "#5b5bd6" },
      { offset: 1, color: "#2f3448" },
    ]);
    const options: EChartsOption = {
      animationDuration: 700,
      animationEasing: "cubicOut",
      aria: { enabled: true },
      grid: { top: 12, right: 6, bottom: 4, left: 6, containLabel: true },
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow", shadowStyle: { color: "rgb(91 91 214 / 8%)" } },
        backgroundColor: "#262d3d",
        borderWidth: 0,
        padding: [7, 10],
        textStyle: { color: "#fff", fontSize: 11 },
        valueFormatter: (value) => `${value} albaranes`,
      },
      xAxis: {
        type: "category",
        data: weekdays,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: "#8b8b8b", fontSize: 10, margin: 10 },
      },
      yAxis: {
        type: "value",
        min: 0,
        max: 100,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { show: false },
        splitNumber: 4,
        splitLine: { show: true, lineStyle: { color: "#f0f1f5", type: "dashed" } },
      },
      series: [
        {
          name: "Albaranes",
          type: "bar",
          barMaxWidth: 34,
          barMinHeight: 8,
          data: values.map((value, index) => ({
            value,
            itemStyle: {
              color: index === peakIndex ? peakBar : regularBar,
              borderRadius: [6, 6, 2, 2],
            },
          })),
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
  }, [values, weekdays]);

  return (
    <div
      ref={chartElement}
      className="purchase-activity-chart"
      role="img"
      aria-label="Actividad de compras de los últimos siete días"
    />
  );
}
