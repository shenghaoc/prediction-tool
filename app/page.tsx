'use client';
import '@ant-design/v5-patch-for-react-19';
import React, { useState, useRef, useMemo, useCallback } from 'react';
import {
	Chart as ChartJS,
	CategoryScale,
	LinearScale,
	PointElement,
	LineElement,
	Title as chartTitle,
	Tooltip,
	Legend
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { Form, Select, InputNumber, Button, Typography, Statistic, Col, Row, Divider, message } from 'antd';
import { DatePicker } from 'antd';
import dayjs, { Dayjs } from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import utc from 'dayjs/plugin/utc';
dayjs.extend(customParseFormat);
dayjs.extend(utc);
ChartJS.register(
	CategoryScale,
	LinearScale,
	PointElement,
	LineElement,
	chartTitle,
	Tooltip,
	Legend
);

const chartOptions = {
	responsive: true,
	plugins: {
		legend: {
			position: 'top' as const
		},
		title: {
			display: false,
			text: 'Predicted Trends for Past 12 Months'
		}
	},
	animation: {
		duration: 800,
		easing: 'easeInOutQuart' as const // Chart.js expects a specific literal type
	}
};

const initialFormValues = {
	ml_model: 'Support Vector Regression',
	town: 'ANG MO KIO',
	storey_range: '01 TO 03',
	flat_model: '2-room',
	floor_area_sqm: 1,
	lease_commence_date: dayjs.utc('2022-02', 'YYYY-MM')
};

const defaultLabels = [...Array(13).keys()].reverse().map((x) => initialFormValues.lease_commence_date.subtract(x, 'month').format('YYYY-MM'));

const defaultChartConfig = {
	labels: defaultLabels,
	datasets: [
		{
			label: 'Sample Trends',
			data: defaultLabels.map(() => 0.0),
			borderColor: 'rgb(255, 99, 132)',
			backgroundColor: 'rgba(255, 99, 132, 0.5)'
		}
	]
};

import { ML_MODELS, TOWNS, STOREY_RANGES, FLAT_MODELS } from '../lib/lists';

const { Option } = Select;
const { Title } = Typography;

export type FieldType = {
	ml_model: string;
	town: string;
	storey_range: string;
	flat_model: string;
	floor_area_sqm: number;
	lease_commence_date: Dayjs;
};

type ApiResponse = { labels: string; data: number }[];
type ChartConfig = {
	labels: string[];
	datasets: Array<{
		label: string;
		data: number[];
		borderColor: string;
		backgroundColor: string;
	}>;
};

export default function Home() {
	const curr = useMemo(() => initialFormValues.lease_commence_date, []);
	const labels = useMemo(
		() => [...Array(13).keys()].reverse().map((x) => curr.subtract(x, 'month').format('YYYY-MM')),
		[curr]
	);

	const [output, setOutput] = useState(0.0);
	const [config, setConfig] = useState<ChartConfig>(defaultChartConfig);
	const [loading, setLoading] = useState(false);
	const [form] = Form.useForm<FieldType>();
	const chartRef = useRef(null);

	const disabledYear = useCallback((current: Dayjs) => {
		return current.isBefore('1960-01-01') || current.isAfter('2022-01-01', 'year');
	}, []);

	const handleFinish = useCallback(async (values: FieldType) => {
		setLoading(true);
		const formData = new FormData();
		formData.append('ml_model', values.ml_model);
		formData.append('month_start', curr.subtract(12, 'month').format('YYYY-MM'));
		formData.append('month_end', curr.format('YYYY-MM'));
		formData.append('town', values.town);
		formData.append('storey_range', values.storey_range);
		formData.append('flat_model', values.flat_model);
		formData.append('floor_area_sqm', values.floor_area_sqm.toString());
		formData.append('lease_commence_date', dayjs(values.lease_commence_date).year().toString());
		try {
			const response = await fetch(
				'https://ee4802-g20-tool.shenghaoc.workers.dev/api/prices',
				{
					method: 'POST',
					body: formData
				}
			);
			if (!response.ok) {
				const errorText = await response.text();
				throw new Error(`API request failed: ${errorText}`);
			}
			const server_data: ApiResponse = await response.json();
			setConfig({
				labels: server_data.map((x) => x.labels),
				datasets: [
					{
						label: 'Trends',
						data: server_data.map((x) => x.data),
						borderColor: 'rgb(53, 162, 235)',
						backgroundColor: 'rgba(53, 162, 235, 0.5)'
					}
				]
			});
			setOutput(server_data[server_data.length - 1]?.data ?? 0.0);
			form.resetFields();
		} catch (err: any) {
			message.error(err?.message || 'Failed to fetch prediction. Please try again.');
		} finally {
			setLoading(false);
		}
	}, [curr, form]);

	return (
		<main style={{ padding: `24px` }}>
			<Title level={2}>Price Prediction</Title>
			<Form
				form={form}
				labelCol={{ span: 4 }}
				wrapperCol={{ span: 14 }}
				layout="horizontal"
				initialValues={initialFormValues}
				onFinish={handleFinish}
			>
				<Form.Item<FieldType>
					name="ml_model"
					label="ML Model"
					rules={[{ required: true, message: 'Please choose an ML Model!' }]}
				>
					<Select>
						{ML_MODELS.map((ml_model) => (
							<Option key={ml_model} value={ml_model}>
								{ml_model}
							</Option>
						))}
					</Select>
				</Form.Item>
				<Form.Item<FieldType>
					name="town"
					label="Town"
					rules={[{ required: true, message: 'Missing Town!' }]}
				>
					<Select>
						{TOWNS.map((town) => (
							<Option key={town} value={town}>
								{town}
							</Option>
						))}
					</Select>
				</Form.Item>
				<Form.Item<FieldType>
					name="storey_range"
					label="Storey Range"
					rules={[{ required: true, message: 'Missing Storey Range!' }]}
				>
					<Select>
						{STOREY_RANGES.map((storey_range) => (
							<Option key={storey_range} value={storey_range}>
								{storey_range}
							</Option>
						))}
					</Select>
				</Form.Item>
				<Form.Item<FieldType>
					name="flat_model"
					label="Flat Model"
					rules={[{ required: true, message: 'Missing Flat Model!' }]}
				>
					<Select>
						{FLAT_MODELS.map((flat_model) => (
							<Option key={flat_model} value={flat_model}>
								{flat_model}
							</Option>
						))}
					</Select>
				</Form.Item>
				<Form.Item<FieldType>
					name="floor_area_sqm"
					label="Floor Area"
					rules={[{ required: true, message: 'Missing Floor Area!' }]}
				>
					<InputNumber type="number" min={1} addonAfter="m²" />
				</Form.Item>
				<Form.Item<FieldType>
					name="lease_commence_date"
					label="Lease Commence Date"
					rules={[{ required: true, message: 'Missing Lease Commence Date!' }]}
				>
					<DatePicker picker="year" inputReadOnly={true} disabledDate={disabledYear} />
				</Form.Item>
				<Row gutter={16}>
					<Col span={12}>
						<Statistic title="Prediction" value={output} prefix="$" precision={2} valueStyle={{ fontWeight: 600 }} />
						<span style={{ position: 'absolute', left: '-9999px' }} aria-live="polite">${output.toFixed(2)}</span>
						<Button style={{ marginTop: 16 }} type="primary" htmlType="submit" loading={loading} disabled={loading} aria-label="Get prediction">
							Get prediction
						</Button>
					</Col>
				</Row>
			</Form>
			<Divider>Predicted Trends for Past 12 Months</Divider>
			<Line ref={chartRef} options={chartOptions} data={config} />
		</main>
	);
}
