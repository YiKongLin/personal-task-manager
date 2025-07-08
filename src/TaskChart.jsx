import React, { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';

// 缓急程度与重要性标签
const URGENCY_LABELS = ['极低','很低','较低','低','一般','较高','高','很高','极高','紧急','最紧急'];
const IMPORTANCE_LABELS = ['极不重要','很不重要','较不重要','不重要','一般','较重要','重要','很重要','极重要','关键','最关键'];

function getColorByUrgency(urgency) {
  // 色彩更丰富，渐变色带
  if (urgency >= 9) return 'rgba(255,0,102,0.85)'; // 粉红
  if (urgency >= 8) return 'rgba(255,87,34,0.85)'; // 橙红
  if (urgency >= 7) return 'rgba(255,193,7,0.85)'; // 金黄
  if (urgency >= 6) return 'rgba(76,175,80,0.85)'; // 绿色
  if (urgency >= 5) return 'rgba(0,188,212,0.85)'; // 青色
  if (urgency >= 4) return 'rgba(33,150,243,0.85)'; // 蓝色
  if (urgency >= 3) return 'rgba(156,39,176,0.85)'; // 紫色
  if (urgency >= 2) return 'rgba(121,85,72,0.85)'; // 棕色
  return 'rgba(158,158,158,0.85)'; // 灰色
}
function getSizeByImportance(importance) {
  return 8 + importance * 2;
}

function drawCustomIcon(ctx2d, icon, x, y, r) {
  if (!icon) return;
  if (icon.startsWith('data:') || icon.startsWith('url:')) {
    const img = new window.Image();
    img.src = icon.startsWith('url:') ? icon.slice(4) : icon;
    img.onload = () => ctx2d.drawImage(img, x - r, y - r, r * 2, r * 2);
    if (img.complete) ctx2d.drawImage(img, x - r, y - r, r * 2, r * 2);
    return;
  }
  if (icon.startsWith('svg:')) {
    const svg = atob(icon.slice(4));
    const svgUrl = 'data:image/svg+xml;base64,' + btoa(`<svg xmlns='http://www.w3.org/2000/svg' width='${r*2}' height='${r*2}'>${svg}</svg>`);
    const img = new window.Image();
    img.src = svgUrl;
    img.onload = () => ctx2d.drawImage(img, x - r, y - r, r * 2, r * 2);
    if (img.complete) ctx2d.drawImage(img, x - r, y - r, r * 2, r * 2);
    return;
  }
  ctx2d.save();
  ctx2d.translate(x, y);
  ctx2d.strokeStyle = '#333';
  ctx2d.lineWidth = 2;
  if (icon === 'star') {
    ctx2d.beginPath();
    for (let i = 0; i < 5; i++) {
      ctx2d.lineTo(Math.cos((18 + i * 72) / 180 * Math.PI) * r, -Math.sin((18 + i * 72) / 180 * Math.PI) * r);
      ctx2d.lineTo(Math.cos((54 + i * 72) / 180 * Math.PI) * r * 0.5, -Math.sin((54 + i * 72) / 180 * Math.PI) * r * 0.5);
    }
    ctx2d.closePath();
    ctx2d.fillStyle = '#FFD700';
    ctx2d.fill();
    ctx2d.stroke();
  } else if (icon === 'cross') {
    ctx2d.beginPath();
    ctx2d.moveTo(-r, -r);
    ctx2d.lineTo(r, r);
    ctx2d.moveTo(-r, r);
    ctx2d.lineTo(r, -r);
    ctx2d.strokeStyle = '#d32f2f';
    ctx2d.lineWidth = 4;
    ctx2d.stroke();
  }
  ctx2d.restore();
}

export default function TaskChart({ tasks, onEdit, onIconEdit, quickEdit, onChartDrag }) {
  const chartRef = useRef();
  const chartInstance = useRef();
  const dragState = useRef({ idx: null, offset: null });

  useEffect(() => {
    const ctx = chartRef.current;
    if (!ctx) return;
    if (chartInstance.current) chartInstance.current.destroy();
    chartInstance.current = new Chart(ctx, {
      type: 'scatter',
      data: {
        datasets: [
          {
            label: '任务分布',
            data: tasks.map((t, i) => ({
              x: t.urgency,
              y: t.importance,
              label: t.title,
              icon: t.icon,
              _idx: i
            })),
            backgroundColor: tasks.map(t => 'rgba(0,0,0,0)'),
            pointRadius: tasks.map(t => getSizeByImportance(t.importance)),
            pointStyle: 'circle',
            pointHoverRadius: 16,
          }
        ]
      },
      options: {
        plugins: {
          tooltip: {
            callbacks: {
              label: ctx => `${ctx.raw.label}（缓急：${URGENCY_LABELS[Math.round(ctx.raw.x)]}，重要：${IMPORTANCE_LABELS[Math.round(ctx.raw.y)]}）`
            }
          }
        },
        scales: {
          x: {
            title: { display: true, text: '缓急程度' },
            min: 0, max: 10,
            grid: { color: '#bbb' },
            ticks: {
              stepSize: 1,
              callback: v => URGENCY_LABELS[v] || v,
              font: { size: 12 }
            }
          },
          y: {
            title: { display: true, text: '重要性' },
            min: 0, max: 10,
            grid: { color: '#bbb' },
            ticks: {
              stepSize: 1,
              callback: v => IMPORTANCE_LABELS[v] || v,
              font: { size: 12 }
            }
          }
        },
        animation: { duration: 800 },
        onClick: (e, elements) => {
          if (elements.length) {
            const idx = elements[0].index;
            onEdit(idx);
          }
        },
        onDoubleClick: (e, elements) => {
          if (elements.length) {
            const idx = elements[0].index;
            onIconEdit(idx);
          }
        },
        events: ['click', 'dblclick', 'mousemove', 'mouseout'],
      },
      plugins: [{
        afterDraw: chart => {
          const ctx2d = chart.ctx;
          const meta = chart.getDatasetMeta(0);
          tasks.forEach((t, i) => {
            const pt = meta.data[i];
            if (!pt) return;
            const { x, y } = pt.getProps(['x', 'y'], true);
            const r = getSizeByImportance(t.importance);
            ctx2d.save();
            ctx2d.beginPath();
            ctx2d.arc(x, y, r, 0, 2 * Math.PI);
            ctx2d.fillStyle = getColorByUrgency(t.urgency);
            ctx2d.globalAlpha = 0.7;
            ctx2d.fill();
            ctx2d.globalAlpha = 1;
            ctx2d.restore();
            drawCustomIcon(ctx2d, t.icon, x, y, r * 0.8);
            ctx2d.save();
            ctx2d.font = '12px sans-serif';
            ctx2d.textAlign = 'center';
            ctx2d.textBaseline = 'top';
            ctx2d.fillStyle = '#333';
            ctx2d.fillText(t.title, x, y + r + 2);
            ctx2d.restore();
          });
        }
      }]
    });
    // 拖动交互
    if (quickEdit) {
      const canvas = ctx;
      let dragging = false;
      let dragIdx = null;
      let dragStart = null;
      let startUrgency = null;
      let startImportance = null;
      const getPointIdx = (evt) => {
        const rect = canvas.getBoundingClientRect();
        const mx = evt.touches ? evt.touches[0].clientX : evt.clientX;
        const my = evt.touches ? evt.touches[0].clientY : evt.clientY;
        const x = mx - rect.left;
        const y = my - rect.top;
        const meta = chartInstance.current.getDatasetMeta(0);
        for (let i = 0; i < tasks.length; i++) {
          const pt = meta.data[i];
          if (!pt) continue;
          const { x: px, y: py } = pt.getProps(['x', 'y'], true);
          const r = getSizeByImportance(tasks[i].importance);
          if ((x - px) ** 2 + (y - py) ** 2 < r * r) return i;
        }
        return null;
      };
      const handleDown = evt => {
        dragIdx = getPointIdx(evt);
        if (dragIdx !== null) {
          dragging = true;
          const rect = canvas.getBoundingClientRect();
          const mx = evt.touches ? evt.touches[0].clientX : evt.clientX;
          const my = evt.touches ? evt.touches[0].clientY : evt.clientY;
          dragStart = { x: mx - rect.left, y: my - rect.top };
          // 记录初始值
          startUrgency = tasks[dragIdx].urgency;
          startImportance = tasks[dragIdx].importance;
          evt.preventDefault();
        }
      };
      const handleMove = evt => {
        if (!dragging || dragIdx === null) return;
        const rect = canvas.getBoundingClientRect();
        const mx = evt.touches ? evt.touches[0].clientX : evt.clientX;
        const my = evt.touches ? evt.touches[0].clientY : evt.clientY;
        const x = mx - rect.left;
        const y = my - rect.top;
        const chart = chartInstance.current;
        const xScale = chart.scales.x;
        const yScale = chart.scales.y;
        // 直接将当前位置映射为新坐标，避免累积误差和卡顿
        const newUrgency = xScale.getValueForPixel(x);
        const newImportance = yScale.getValueForPixel(y);
        onChartDrag && onChartDrag(dragIdx, newUrgency, newImportance);
      };
      const handleUp = () => { dragging = false; dragIdx = null; dragStart = null; startUrgency = null; startImportance = null; };

      canvas.addEventListener('touchstart', handleDown);
      canvas.addEventListener('touchmove', handleMove);
      canvas.addEventListener('touchend', handleUp);
      canvas.addEventListener('mousedown', handleDown);
      canvas.addEventListener('mousemove', handleMove);
      canvas.addEventListener('mouseup', handleUp);
      return () => {
        canvas.removeEventListener('touchstart', handleDown);
        canvas.removeEventListener('touchmove', handleMove);
        canvas.removeEventListener('touchend', handleUp);
        canvas.removeEventListener('mousedown', handleDown);
        canvas.removeEventListener('mousemove', handleMove);
        canvas.removeEventListener('mouseup', handleUp);
      };
    }
  }, [tasks, onEdit, onIconEdit, quickEdit, onChartDrag]);

  return <canvas ref={chartRef} style={{ position: 'relative', cursor: quickEdit ? 'grab' : 'default' }} />;
}
