// Constants and static data for prediction tool
// Use these for dropdowns, validation, and API calls

// ML Model options
export const ML_MODELS = [
	'Support Vector Regression',
	'Ridge Regression'
] as const;
export type MLModel = typeof ML_MODELS[number];

// HDB Towns
export const TOWNS = [
	'ANG MO KIO',
	'BEDOK',
	'BISHAN',
	'BUKIT BATOK',
	'BUKIT MERAH',
	'BUKIT PANJANG',
	'BUKIT TIMAH',
	'CENTRAL AREA',
	'CHOA CHU KANG',
	'CLEMENTI',
	'GEYLANG',
	'HOUGANG',
	'JURONG EAST',
	'JURONG WEST',
	'KALLANG/WHAMPOA',
	'MARINE PARADE',
	'PASIR RIS',
	'PUNGGOL',
	'QUEENSTOWN',
	'SEMBAWANG',
	'SENGKANG',
	'SERANGOON',
	'TAMPINES',
	'TOA PAYOH',
	'WOODLANDS',
	'YISHUN'
] as const;
export type Town = typeof TOWNS[number];

// Storey ranges
export const STOREY_RANGES = [
	'01 TO 03',
	'04 TO 06',
	'07 TO 09',
	'10 TO 12',
	'13 TO 15',
	'16 TO 18',
	'19 TO 21',
	'22 TO 24',
	'25 TO 27',
	'28 TO 30',
	'31 TO 33',
	'34 TO 36',
	'37 TO 39',
	'40 TO 42',
	'43 TO 45',
	'46 TO 48',
	'49 TO 51'
] as const;
export type StoreyRange = typeof STOREY_RANGES[number];

// Flat models
export const FLAT_MODELS = [
	'2-room',
	'Adjoined flat',
	'Apartment',
	'DBSS',
	'Improved',
	'Improved-Maisonette',
	'Maisonette',
	'Model A',
	'Model A-Maisonette',
	'Model A2',
	'Multi Generation',
	'New Generation',
	'Premium Apartment',
	'Premium Apartment Loft',
	'Premium Maisonette',
	'Simplified',
	'Standard',
	'Terrace',
	'Type S1',
	'Type S2'
] as const;
export type FlatModel = typeof FLAT_MODELS[number];
