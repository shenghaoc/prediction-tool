import React, {useState} from 'react';
import './App.css';
import {Line} from '@ant-design/charts';
import $ from 'jquery';
import {
  Form,
  Select,
  InputNumber,
  Button,
  Typography,
  Statistic,
  Col,
  Row
} from 'antd';
import {DatePicker} from './components';
import dayjs, {Dayjs} from 'dayjs';

import url_map from './url.json'
import town_list from './town.json';
import flat_type_list from './flat_type.json';
import storey_range_list from './storey_range.json';
import flat_model_list from './flat_model.json';

import customParseFormat from 'dayjs/plugin/customParseFormat';

dayjs.extend(customParseFormat)

const {Option} = Select;
const {Title} = Typography;

const ml_model_list = Object.keys(url_map).sort()
town_list.sort()
flat_type_list.sort()
storey_range_list.sort()
flat_model_list.sort()

export const options = {
  responsive: true,
  plugins: {
    legend: {
      position: 'top' as const,
    },
    title: {
      display: true,
      text: 'Predicted Trends for Past 12 Months',
    },
  },
};

let curr = dayjs()
let curr_minus_1_year = curr.subtract(1, 'year')
// @ts-ignore
const labels = [...Array(12).keys()]
  .map(x => curr_minus_1_year.add(x, 'month').format('YYYY-MM'))

function disabledDate(current: Dayjs) {
  return current.isAfter(dayjs()) || current.isBefore('1960-01-01', 'year')
}

export function App() {
  // @ts-ignore
  const [values, setValues] = React.useState({
    ml_model: ml_model_list[0],
    town: town_list[0],
    flat_type: flat_type_list[0],
    storey_range: storey_range_list[0],
    floor_area_sqm: '',
    flat_model: flat_model_list[0],
    resale_price: '',
  });

  const [leaseCommenceDate, setLeaseCommenceDate] = useState<Dayjs | null>(null);


  const handleChange = (prop: any) => (value: any) => {
    setValues({...values, [prop]: value});
  };

  const [output, setOutput] = useState(0)

  // @ts-ignore
  const obj = [{'month': labels[0], 'value': Math.random() * 100000}];
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
    if (!values.flat_type) {
      alert('Missing Flat Type!');
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
    if (!leaseCommenceDate) {
      alert("Missing Lease Commence Date!")
      return;
    }

    const INPUT_DATA_FILE = {
      "data": [],
      "method": "predict"
    }

    for (let i = 0; i <= 12; i++) {
      let tmp = [i === 12 ? curr.format('YYYY-MM') : labels[i], values.town, values.storey_range, Number(values.floor_area_sqm),
        values.flat_model, leaseCommenceDate.year()]
      if (i === 0) {
        // @ts-ignore
        INPUT_DATA_FILE["data"] = [tmp]
      } else { // @ts-ignore
        INPUT_DATA_FILE["data"].push(tmp)
      }
    }

    // @ts-ignore
    $.ajax({
      // @ts-ignore
      url: url_map[values.ml_model],
      type: "POST",
      data: JSON.stringify(INPUT_DATA_FILE),
      success: function (data) {
        console.log("Data Loaded: " + JSON.stringify(data));
        setOutput(data["predict"].pop())
        // @ts-ignore
        const obj = [{'month': labels[0], 'value': data["predict"][0]}];
        for (let i = 1; i < labels.length; i++) {
          // @ts-ignore
          obj.push({'month': labels[i], 'value': data["predict"][i]})
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
      },
      contentType: "application/json"
    });
  }

  return (
    <>
      <Form>
        <Title level={2}>
          Price Prediction
        </Title>
        <Form.Item
          label="ML Model"
        >
          <Select defaultValue={values.ml_model} onChange={handleChange('ml_model')}>
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
          <Select value={values.town} onChange={handleChange('town')}>
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
          label="Flat Type"
        >
          <Select value={values.flat_type} onChange={handleChange('flat_type')}>
            {flat_type_list.map((flat_type: string) => (
              <Option
                key={flat_type}
                value={flat_type}
              >
                {flat_type}
              </Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item
          label="Storey Range"
        >
          <Select value={values.storey_range} onChange={handleChange('storey_range')}>
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
          <Select value={values.flat_model} onChange={handleChange('flat_model')}>
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
          <InputNumber
            type="number"
            min="0"
            onChange={handleChange('floor_area_sqm')}
            addonAfter="m²"
          />
        </Form.Item>
        <Form.Item
          label="Lease Commence Date"
        >
          <DatePicker
            picker="year"
            value={leaseCommenceDate}
            inputReadOnly={true}
            disabledDate={disabledDate}
            onChange={(newValue) => {
              setLeaseCommenceDate(newValue);
            }}
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
        </Row>,
      </Form>
      <Title level={3}>
        Predicted Trends for Past 12 Months
      </Title>
      <Line {...config} />
    </>
  )
}

