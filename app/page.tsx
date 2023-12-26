'use client'

import type { NextPage } from 'next'
import Head from 'next/head'
import Image from 'next/image'
import styles from '../styles/Home.module.css'

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
  Input,
  Button,
  Typography,
  Statistic,
  Col,
  Row,
  Divider
} from 'antd';
import {DatePicker} from 'antd';
import dayjs, {Dayjs} from 'dayjs';

import url_map from '../public/url.json'
import month_map from '../public/month.json'
import town_list from '../public/town.json';
import storey_range_map from '../public/storey_range.json';
import flat_model_list from '../public/flat_model.json';

import mapping_rr_map from '../public/mapping_rr.json'
import mapping_svr_map from '../public/mapping_svr.json'

import customParseFormat from 'dayjs/plugin/customParseFormat';

dayjs.extend(customParseFormat)

const {Option} = Select;
const {Title} = Typography;

const ml_model_list = Object.keys(url_map)
const storey_range_list = Object.keys(storey_range_map)

let curr = dayjs("2022-02", "YYYY-MM")
let curr_minus_1_year = curr.subtract(1, 'year')
// @ts-ignore
const labels = [...Array(12).keys()]
  .map(x => curr_minus_1_year.add(x, 'month').format('YYYY-MM'))

// 1960 (first HDB flats) to 2022 (current year)
function disabledYear(current: Dayjs) {
  return current.isBefore('1960-01-01', 'year') || current.isAfter('2022-01-01', 'year')
}

// markup
export default function Home() {
  // @ts-ignore
  const [values, setValues] = useState({
    ml_model: ml_model_list[0],
    month: null,
    town: town_list[0],
    storey_range: storey_range_list[0],
    flat_model: flat_model_list[0],
    floor_area_sqm: 0,
    lease_commence_date: null
  });

  const handleChange = (prop: any) => (event: any) => {
    if (prop === "floor_area_sqm") {
      setValues({...values, [prop]: event.target.value});
    } else {
      setValues({...values, [prop]: event});
    }
  };

  const [output, setOutput] = useState(0)

  // @ts-ignore
  let obj = [{'month': labels[0], 'value': Math.random() * 100000}];
  for (let i = 1; i < labels.length; i++) {
    // @ts-ignore
    obj.push({'month': labels[i], 'value': Math.random() * 100000})
  }

  const [config, setConfig] = useState({
    data: obj,
    height: 400,
    xField: 'month',
    yField: 'value',
    point: {
      size: 5,
      shape: 'diamond',
    },
  });

  function funPredict() {
    if (!values.ml_model) {
      alert('Please choose an ML Model!');
      return;
    }
    if (!values.town) {
      alert('Missing Town!');
      return;
    }
    if (!values.storey_range) {
      alert('Missing Storey Range!');
      return;
    }
    if (!values.flat_model) {
      alert('Missing Flat Model!');
      return;
    }
    if (!values.floor_area_sqm) {
      alert('Missing Floor Area!');
      return;
    }
    if (!values.lease_commence_date) {
      alert("Missing Lease Commence Date!")
      return;
    }

    let mapping_map;
    if (values.ml_model === "Support Vector Regression") {
      mapping_map = mapping_svr_map
    } else if (values.ml_model === "Ridge Regression") {
      mapping_map = mapping_rr_map
    }

    for (let i = 0; i <= labels.length; i++) {
      // @ts-ignore
      let val = mapping_map[0]["intercept"]
      // @ts-ignore
      val += month_map[i === 12 ? curr.format('YYYY-MM') : labels[i]] * mapping_map[0]["month"]
      // @ts-ignore
      val += mapping_map[0][values.town]
      // @ts-ignore
      val += storey_range_map[values.storey_range] * mapping_map[0]["storey_range"]
      // @ts-ignore
      val += values.floor_area_sqm * mapping_map[0]["floor_area_sqm"]
      // @ts-ignore
      val += mapping_map[0][values.flat_model]
      // @ts-ignore
      val += values.lease_commence_date.year() * mapping_map[0]["lease_commence_date"]

      if (i == 0) {
        // @ts-ignore
        obj = [{'month': labels[i], 'value': val}];
      } else if (i == 12) {
        setOutput(val)
      } else {
        // @ts-ignore
        obj.push({'month': labels[i], 'value': val})
      }
    }

    setConfig({
      data: obj,
      height: 400,
      xField: 'month',
      yField: 'value',
      point: {
        size: 5,
        shape: 'diamond',
      },
    })
  }

  type SizeType = Parameters<typeof Form>[0]['size'];

  const [componentSize, setComponentSize] = useState<SizeType | 'default'>('default');
  const onFormLayoutChange = ({size}: { size: SizeType }) => {
    setComponentSize(size);
  };

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
        initialValues={{size: componentSize}}
        onValuesChange={onFormLayoutChange}
        size={componentSize as SizeType}
      >

        <Form.Item
          label="ML Model"
        >
          <Select defaultValue={ml_model_list[0]} onChange={handleChange('ml_model')}>
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
          label="Town"
        >
          <Select defaultValue={town_list[0]} onChange={handleChange('town')}>
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
          label="Storey Range"
        >
          <Select defaultValue={storey_range_list[0]} onChange={handleChange('storey_range')}>
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
          label="Flat Model"
        >
          <Select defaultValue={flat_model_list[0]} onChange={handleChange('flat_model')}>
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
          label="Floor Area"
        >
          <Input
            type="number"
            min={0}
            onChange={handleChange('floor_area_sqm')}
            addonAfter="m²"
          />
        </Form.Item>
        <Form.Item
          label="Lease Commence Date"
        >
          <DatePicker
            picker="year"
            inputReadOnly={true}
            disabledDate={disabledYear}
            onChange={handleChange('lease_commence_date')}
          />
        </Form.Item>
        <Row gutter={16}>
          <Col span={12}>
            <Statistic title="Prediction" value={output} prefix="$" precision={2}/>
            <Button style={{marginTop: 16}} type="primary"
                    onClick={funPredict}>
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

