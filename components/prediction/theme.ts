import type { CSSProperties } from 'react';

export type PredictionTheme = {
	text: string;
	textMuted: string;
	primary: string;
	accent: string;
	lineSoft: string;
	panelBg: string;
	panelStrong: string;
	resultsBg: string;
	resultsBg2: string;
	pricePanelBg: string;
	fieldBg: string;
	focusRing: string;
	shadow: string;
	accentShadow: string;
	meshLine: string;
	orbColor: string;
	chartGrid: string;
	chartLine: string;
	chartFill: string;
	background: string;
	pageBg: string;
	pillBg: string;
};

export function getPredictionTheme(darkMode: boolean): PredictionTheme {
	if (darkMode) {
		return {
			text: '#f2ede6',
			textMuted: '#9e998f',
			primary: '#8daec1',
			accent: '#cf8b60',
			lineSoft: 'rgba(141, 174, 193, 0.16)',
			panelBg: 'rgba(16, 23, 31, 0.78)',
			panelStrong: 'rgba(18, 27, 37, 0.88)',
			resultsBg: 'rgba(18, 26, 35, 0.92)',
			resultsBg2: 'rgba(15, 22, 30, 0.86)',
			pricePanelBg: 'rgba(255, 255, 255, 0.04)',
			fieldBg: 'rgba(255, 255, 255, 0.04)',
			focusRing: 'rgba(141, 174, 193, 0.14)',
			shadow: 'rgba(0, 0, 0, 0.32)',
			accentShadow: 'rgba(207, 139, 96, 0.26)',
			meshLine: 'rgba(255, 255, 255, 0.06)',
			orbColor: 'rgba(207, 139, 96, 0.18)',
			chartGrid: 'rgba(255,255,255,0.08)',
			chartLine: '#cf8b60',
			chartFill: 'rgba(207, 139, 96, 0.16)',
			background: 'linear-gradient(155deg, #091017 0%, #101821 52%, #1a2430 100%)',
			pageBg: '#091017',
			pillBg: 'rgba(255, 255, 255, 0.04)'
		};
	}

	return {
		text: '#1f2328',
		textMuted: '#74685b',
		primary: '#234b61',
		accent: '#af6542',
		lineSoft: 'rgba(116, 92, 68, 0.14)',
		panelBg: 'rgba(255, 250, 244, 0.72)',
		panelStrong: 'rgba(255, 253, 250, 0.82)',
		resultsBg: 'rgba(255, 252, 248, 0.9)',
		resultsBg2: 'rgba(249, 243, 236, 0.84)',
		pricePanelBg: 'rgba(255, 255, 255, 0.46)',
		fieldBg: 'rgba(255, 255, 255, 0.54)',
		focusRing: 'rgba(35, 75, 97, 0.12)',
		shadow: 'rgba(110, 84, 63, 0.12)',
		accentShadow: 'rgba(175, 101, 66, 0.24)',
		meshLine: 'rgba(31, 35, 40, 0.04)',
		orbColor: 'rgba(175, 101, 66, 0.14)',
		chartGrid: 'rgba(31, 35, 40, 0.08)',
		chartLine: '#af6542',
		chartFill: 'rgba(175, 101, 66, 0.12)',
		background: 'linear-gradient(155deg, #f5eee5 0%, #eee4d8 50%, #ece6de 100%)',
		pageBg: '#f5eee5',
		pillBg: 'rgba(255, 251, 246, 0.56)'
	};
}

export function getThemeVars(theme: PredictionTheme): CSSProperties {
	return {
		'--page-bg': theme.pageBg,
		'--text-color': theme.text,
		'--text-muted': theme.textMuted,
		'--primary-color': theme.primary,
		'--accent-color': theme.accent,
		'--line-soft': theme.lineSoft,
		'--panel-bg': theme.panelBg,
		'--panel-strong': theme.panelStrong,
		'--results-bg': theme.resultsBg,
		'--results-bg-2': theme.resultsBg2,
		'--price-panel-bg': theme.pricePanelBg,
		'--field-bg': theme.fieldBg,
		'--pill-bg': theme.pillBg,
		'--focus-ring': theme.focusRing,
		'--panel-shadow': theme.shadow,
		'--accent-shadow': theme.accentShadow,
		'--mesh-line': theme.meshLine,
		'--orb-color': theme.orbColor
	} as CSSProperties;
}
