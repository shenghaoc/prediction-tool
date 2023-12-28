'use client'

import type { NextPage } from 'next'
import Head from 'next/head'
import Image from 'next/image'

import React, {useState} from 'react';
import dynamic from 'next/dynamic'
const Line = dynamic(() => import("@ant-design/plots").then((mod) => ({
  default: mod.Line,
})), {
  ssr: false,
});
import { Suspense } from 'react'
import {
  Form,
  Select,
  InputNumber,
  Button,
  Typography,
  Statistic,
  Col,
  Row,
  Divider
} from 'antd';
import {DatePicker} from 'antd';
import dayjs, {Dayjs} from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
dayjs.extend(customParseFormat)
import { GET } from './api/route';
let lists = GET();

let ml_model_list: string[];
let town_list: string[];
let storey_range_list: string[];
let flat_model_list: string[];
lists.then(response => response.json())
  .then(data => {
    ml_model_list = data["ml_model_list"];
    town_list = data["town_list"];
    storey_range_list = data["storey_range_list"];
    flat_model_list = data["flat_model_list"]
  });

const {Option} = Select;
const {Title} = Typography;

import { funPredict } from './actions';

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

  let curr = dayjs("2022-02", "YYYY-MM")
  let labels = [...Array(13).keys()].reverse()
    .map(x => curr.subtract(x, 'month').format('YYYY-MM'))

  const [config, setConfig] = useState({
    data: labels.map(x => ({'month': x, 'value': 0.00})),
    height: 400,
    xField: 'month',
    yField: 'value',
    point: {
      size: 5,
      shape: 'diamond',
    },
  });

  // 1960 (first HDB flats) to 2022 (current year)
  function disabledYear(current: Dayjs) {
    return current.isBefore('1960-01-01', 'year') || current.isAfter('2022-01-01', 'year')
  }

  return (
    <main style={{padding: `24px`}}>
      <Head>
        <meta charSet="utf-8"/>
        <title>Prediction Tool</title>
        <link rel="canonical" href="https://ee4802-g20-tool.web.app"/>
      </Head>
      <Title level={2}>
        Price Prediction
      </Title>
      <Form
        labelCol={{span: 4}}
        wrapperCol={{span: 14}}
        layout="horizontal"
        initialValues={{
          ml_model: "Support Vector Regression",
          town: "ANG MO KIO",
          storey_range: "01 TO 03",
          flat_model: "2-room",
          floor_area_sqm: 1,
          lease_commence_date: curr
        }}
        onFinish={(values: FieldType) => {
          funPredict(JSON.parse(JSON.stringify(values))).then(response => setConfig(response));
        }}
      >

        <Form.Item<FieldType>
          name="ml_model"
          label="ML Model"
          rules={[{ required: true, message: 'Please choose an ML Model!' }]}
        >
          <Select>
            {ml_model_list.map((ml_model: string) => (
              <Option
                key={ml_model}
                value={ml_model}
              >
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
              <Option
                key={town}
                value={town}
              >
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
              <Option
                key={storey_range}
                value={storey_range}
              >
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
              <Option
                key={flat_model}
                value={flat_model}
              >
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
          <InputNumber
            type="number"
            min={1}
            addonAfter="m²"
          />
        </Form.Item>
        <Form.Item<FieldType>
          name="lease_commence_date"
          label="Lease Commence Date"
          rules={[{ required: true, message: 'Missing Lease Commence Date!' }]}
        >
          <DatePicker
            picker="year"
            inputReadOnly={true}
            disabledDate={disabledYear}
          />
        </Form.Item>
        <Row gutter={16}>
          <Col span={12}>
            <Statistic title="Prediction" value={config.data[12]["value"]} prefix="$" precision={2}/>
            <Button style={{marginTop: 16}} type="primary"
                    htmlType="submit">
              Get prediction
            </Button>
          </Col>
        </Row>
      </Form>
      <Divider>Predicted Trends for Past 12 Months</Divider>
      <Suspense fallback={<div>Loading...</div>}>
        <Line {...config} />
      </Suspense>
    </main>
  )
}

