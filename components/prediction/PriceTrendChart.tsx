'use client';

import React, { useRef, useState } from 'react';
import type { TrendPoint } from './types';

type PriceTrendChartProps = {
	data: TrendPoint[];
};

export default function PriceTrendChart({ data }: PriceTrendChartProps) {
	const containerRef = useRef<HTMLDivElement>(null);
	const [tooltip, setTooltip] = useState<{ idx: number; x: number; y: number; label: string; value: number } | null>(null);

	const W = 600, H = 300;
	const padL = 56, padR = 18, padT = 24, padB = 36;
	const cW = W - padL - padR, cH = H - padT - padB;

	if (!data || data.length === 0) return null;

	const values = data.map(d => d.value);
	const minV = Math.min(...values) * 0.92;
	const maxV = Math.max(...values) * 1.04;
	const rangeV = maxV - minV || 1;

	const pts = data.map((d, i) => ({
		x: padL + (i / (data.length - 1)) * cW,
		y: padT + cH - ((d.value - minV) / rangeV) * cH,
		...d,
	}));

	// Smooth curve via cardinal spline
	const catmullRom = (p: typeof pts, t = 0.35) => {
		if (p.length < 2) return '';
		let d = `M${p[0].x},${p[0].y}`;
		for (let i = 0; i < p.length - 1; i++) {
			const p0 = p[Math.max(i - 1, 0)];
			const p1 = p[i];
			const p2 = p[i + 1];
			const p3 = p[Math.min(i + 2, p.length - 1)];
			const cp1x = p1.x + (p2.x - p0.x) * t / 3;
			const cp1y = p1.y + (p2.y - p0.y) * t / 3;
			const cp2x = p2.x - (p3.x - p1.x) * t / 3;
			const cp2y = p2.y - (p3.y - p1.y) * t / 3;
			d += ` C${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
		}
		return d;
	};

	const linePath = catmullRom(pts);
	const areaPath = linePath + ` L${pts[pts.length - 1].x},${padT + cH} L${pts[0].x},${padT + cH} Z`;

	const gridN = 4;
	const yTicks = Array.from({ length: gridN + 1 }, (_, i) => {
		const val = minV + (rangeV * i) / gridN;
		const y = padT + cH - (i / gridN) * cH;
		return { val, y };
	});

	const peakIdx = values.indexOf(Math.max(...values));
	const lastIdx = values.length - 1;
	const fmtK = (v: number) => v >= 1e6 ? `$${(v/1e6).toFixed(1)}M` : v >= 1e3 ? `$${Math.round(v/1e3)}k` : `$${Math.round(v)}`;
	const fmtFull = (v: number) =>
		v.toLocaleString('en-SG', { style: 'currency', currency: 'SGD', maximumFractionDigits: 0 });

	const handleMove = (e: React.MouseEvent) => {
		if (!containerRef.current) return;
		const rect = containerRef.current.getBoundingClientRect();
		const svgX = ((e.clientX - rect.left) / rect.width) * W;
		let closest = 0, closestDist = Infinity;
		pts.forEach((p, i) => {
			const dist = Math.abs(p.x - svgX);
			if (dist < closestDist) { closestDist = dist; closest = i; }
		});
		const p = pts[closest];
		const pxX = (p.x / W) * rect.width;
		const pxY = (p.y / H) * rect.height;
		setTooltip({ idx: closest, x: pxX, y: pxY, label: p.label, value: p.value });
	};

	return (
		<div className="chart-frame" ref={containerRef}
			onMouseMove={handleMove}
			onMouseLeave={() => setTooltip(null)}
			style={{ cursor: 'crosshair', position: 'relative' }}>
			<svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', overflow: 'visible', display: 'block' }}>
				<defs>
					<linearGradient id="cg" x1="0" y1="0" x2="0" y2="1">
						<stop offset="0%" stopColor="var(--chart-line)" stopOpacity="0.42" />
						<stop offset="55%" stopColor="var(--chart-line)" stopOpacity="0.14" />
						<stop offset="100%" stopColor="var(--chart-line)" stopOpacity="0" />
					</linearGradient>
				</defs>
				{yTicks.map((t, i) => (
					<g key={i}>
						<line x1={padL} x2={W - padR} y1={t.y} y2={t.y} stroke="var(--chart-grid)" strokeDasharray="3 10" />
						<text x={padL - 10} y={t.y + 4} textAnchor="end" fill="var(--text-muted)" fontSize="11" fontFamily="'DM Sans', sans-serif" fontWeight="600">{fmtK(t.val)}</text>
					</g>
				))}
				{pts.filter((_, i) => i % 3 === 0 || i === lastIdx).map((p, i) => (
					<text key={i} x={p.x} y={padT + cH + 22} textAnchor="middle" fill="var(--text-muted)" fontSize="11" fontFamily="'DM Sans', sans-serif" fontWeight="600">{p.label}</text>
				))}
				<path d={areaPath} fill="url(#cg)" />
				<path d={linePath} fill="none" stroke="var(--chart-line)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
				{/* Peak dot */}
				<circle cx={pts[peakIdx].x} cy={pts[peakIdx].y} r="5" fill="var(--primary)" stroke="var(--panel-strong)" strokeWidth="2" />
				{/* Latest dot */}
				<circle cx={pts[lastIdx].x} cy={pts[lastIdx].y} r="6" fill="var(--accent)" stroke="var(--panel-strong)" strokeWidth="2.5" />
				{/* Hover line + dot */}
				{tooltip && (
					<g>
						<line x1={pts[tooltip.idx].x} x2={pts[tooltip.idx].x} y1={padT} y2={padT + cH}
							stroke="var(--chart-line)" strokeOpacity="0.22" strokeDasharray="4 8" />
						<circle cx={pts[tooltip.idx].x} cy={pts[tooltip.idx].y} r="5"
							fill="var(--panel-strong)" stroke="var(--chart-line)" strokeWidth="2" />
					</g>
				)}
			</svg>
			{tooltip && (
				<div className="chart-tooltip visible" style={{ left: tooltip.x, top: tooltip.y }}>
					<div className="chart-tooltip-label">{tooltip.label}</div>
					<div className="chart-tooltip-value">{fmtFull(tooltip.value)}</div>
				</div>
			)}
		</div>
	);
}
