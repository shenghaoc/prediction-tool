'use client';

import React, { useState, useRef } from 'react';
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
import { Suspense } from 'react';
import { Form, Select, InputNumber, Button, Typography, Statistic, Col, Row, Divider } from 'antd';
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

const options = {
	responsive: true,
	plugins: {
		legend: {
			position: 'top' as const
		},
		title: {
			display: false,
			text: 'Predicted Trends for Past 12 Months'
		}
	}
};

import { ml_model_list } from '../lib/lists';
import { town_list } from '../lib/lists';
import { storey_range_list } from '../lib/lists';
import { flat_model_list } from '../lib/lists';

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

// markup
export default function Home() {
	let curr = dayjs.utc('2022-02', 'YYYY-MM');
	let labels = [...Array(13).keys()]
		.reverse()
		.map((x) => curr.subtract(x, 'month').format('YYYY-MM'));

	const [output, setOutput] = useState(0.0);
	const [config, setConfig] = useState({
		labels,
		datasets: [
			{
				label: 'Sample Trends',
				data: labels.map(() => 0.0),
				borderColor: 'rgb(255, 99, 132)',
				backgroundColor: 'rgba(255, 99, 132, 0.5)'
			}
		]
	});

	// 1960 (first HDB flats) to 2022 (current year)
	function disabledYear(current: Dayjs) {
		return current.isBefore('1960-01-01', 'year') || current.isAfter('2022-01-01', 'year');
	}

	const chartRef = useRef(null);
	return (
		<main style={{ padding: `24px` }}>
			<Title level={2}>Price Prediction</Title>
			<Form
				labelCol={{ span: 4 }}
				wrapperCol={{ span: 14 }}
				layout="horizontal"
				initialValues={{
					ml_model: 'Support Vector Regression',
					town: 'ANG MO KIO',
					storey_range: '01 TO 03',
					flat_model: '2-room',
					floor_area_sqm: 1,
					lease_commence_date: curr
				}}
				onFinish={(values: FieldType) => {
					const res = fetch(
						'https://ee4802-g20-tool.schoenherrchen.workers.dev/api/prices?' +
							new URLSearchParams({
								ml_model: values.ml_model,
								month_start: curr.subtract(12, 'month').format('YYYY-MM'),
								month_end: curr.format('YYYY-MM'),
								town: values.town,
								storey_range: values.storey_range,
								flat_model: values.flat_model,
								floor_area_sqm: values.floor_area_sqm.toString(),
								lease_commence_date: dayjs(values.lease_commence_date).year().toString()
							}),
						{
							method: 'GET' // *GET, POST, PUT, DELETE, etc.
						}
					);
					res.then((response) =>
						response.json().then((server_data: [{ labels: string; data: number }]) => {
							setConfig({
								labels: server_data.map((x: { labels: string; data: number }) => x['labels']),
								datasets: [
									{
										label: 'Trends',
										data: server_data.map((x: { labels: string; data: number }) => x['data']),
										borderColor: 'rgb(53, 162, 235)',
										backgroundColor: 'rgba(53, 162, 235, 0.5)'
									}
								]
							});
							setOutput(server_data[server_data.length - 1]['data']);
						})
					);
				}}
			>
				<Form.Item<FieldType>
					name="ml_model"
					label="ML Model"
					rules={[{ required: true, message: 'Please choose an ML Model!' }]}
				>
					<Select>
						{ml_model_list.map((ml_model: string) => (
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
						{town_list.map((town: string) => (
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
						{storey_range_list.map((storey_range: string) => (
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
						{flat_model_list.map((flat_model: string) => (
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
						<Statistic title="Prediction" value={output} prefix="$" precision={2} />
						<Button style={{ marginTop: 16 }} type="primary" htmlType="submit">
							Get prediction
						</Button>
					</Col>
				</Row>
			</Form>
			<Divider>Predicted Trends for Past 12 Months</Divider>
			<Suspense fallback={<div>Loading...</div>}>
				<Line ref={chartRef} options={options} data={config} />
			</Suspense>
		</main>
	);
}
