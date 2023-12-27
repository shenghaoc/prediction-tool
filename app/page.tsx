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

import ml_model_map from '../public/ml_model.json'
import month_map from '../public/month.json'
import town_list from '../public/town.json';
import storey_range_map from '../public/storey_range.json';
import flat_model_list from '../public/flat_model.json';

import customParseFormat from 'dayjs/plugin/customParseFormat';

dayjs.extend(customParseFormat)

const {Option} = Select;
const {Title} = Typography;

const ml_model_list = Object.keys(ml_model_map)
const storey_range_list = Object.keys(storey_range_map)

let curr = dayjs("2022-02", "YYYY-MM")
const labels = [...Array(13).keys()].reverse()
  .map(x => curr.subtract(x, 'month').format('YYYY-MM'))

// 1960 (first HDB flats) to 2022 (current year)
function disabledYear(current: Dayjs) {
  return current.isBefore('1960-01-01', 'year') || current.isAfter('2022-01-01', 'year')
}

// markup
export default function Home() {


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

  type FieldType = {
    ml_model: string;
    town: string;
    storey_range: string;
    flat_model: string;
    floor_area_sqm: number;
    lease_commence_date: Dayjs;
  };

  const funPredict = (values: FieldType) => {

    let mapping_map = ml_model_map[values.ml_model as keyof typeof ml_model_map]["mapping"];


    setConfig({
      data: labels.map(x => ({
        'month': x, 'value': Math.round((mapping_map["intercept"]
          + month_map[x as keyof typeof month_map] * mapping_map["month"]
          + mapping_map["town"][values.town as keyof typeof mapping_map["town"]]
          + storey_range_map[values.storey_range as keyof typeof storey_range_map] * mapping_map["storey_range"]
          + values.floor_area_sqm * mapping_map["floor_area_sqm"]
          + mapping_map["flat_model"][values.flat_model as keyof typeof mapping_map["flat_model"]]
          + values.lease_commence_date.year() * mapping_map["lease_commence_date"]) * 100) / 100
      })),
      height: 400,
      xField: 'month',
      yField: 'value',
      point: {
        size: 5,
        shape: 'diamond',
      },
    })
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
          ml_model: ml_model_list[0],
          month: null,
          town: town_list[0],
          storey_range: storey_range_list[0],
          flat_model: flat_model_list[0],
          floor_area_sqm: 1,
          lease_commence_date: null
        }}
        onFinish={funPredict}
      >

        <Form.Item
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
        <Form.Item
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
        <Form.Item
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
        <Form.Item
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
        <Form.Item
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
        <Form.Item
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

