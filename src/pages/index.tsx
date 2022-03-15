import React, {useState} from 'react';
import {Helmet} from "react-helmet"
import 'antd/dist/antd.less';
import {Line} from '@ant-design/charts';
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
import {DatePicker} from '../components';
import dayjs, {Dayjs} from 'dayjs';

import url_map from '../../content/url.json'
import month_map from '../../content/month.json'
import town_list from '../../content/town.json';
import storey_range_map from '../../content/storey_range.json';
import flat_model_list from '../../content/flat_model.json';

import mapping_rr_map from '../../content/mapping_rr.json'
import mapping_svr_map from '../../content/mapping_svr.json'

import customParseFormat from 'dayjs/plugin/customParseFormat';

dayjs.extend(customParseFormat)

const {Option} = Select;
const {Title} = Typography;

const ml_model_list = Object.keys(url_map)
const storey_range_list = Object.keys(storey_range_map)

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

// 2017 (start of data) to 2022-02 (current month)
function disabledMonth(current: Dayjs) {
  return current.isBefore('2017-01-01', 'year') || current.isAfter('2022-02-01', 'month')
}

// 1960 (first HDB flats) to 2022 (current year)
function disabledYear(current: Dayjs) {
  return current.isBefore('1960-01-01', 'year') || current.isAfter('2022-01-01', 'year')
}

// markup
const IndexPage = () => {
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
    if (!values.month) {
      alert('Missing Month!');
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

    let obj;
    for (let i = 0; i <= labels.length; i++) {
      let val = mapping_map[0]["intercept"]
      val += month_map[i === 12 ? values.month.format('YYYY-MM') : labels[i]] * mapping_map[0]["month"]
      val += mapping_map[0][values.town]
      val += storey_range_map[values.storey_range] * mapping_map[0]["storey_range"]
      val += values.floor_area_sqm * mapping_map[0]["floor_area_sqm"]
      val += mapping_map[0][values.flat_model]
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
      <Helmet>
        <meta charSet="utf-8"/>
        <title>Prediction Tool</title>
        <link rel="canonical" href="https://ee4802-g20-tool.web.app"/>
      </Helmet>
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
          label="Month"
        >
          <DatePicker
            picker="month"
            inputReadOnly={true}
            disabledDate={disabledMonth}
            onChange={handleChange('month')}
          />
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
      <Line {...config} />
    </main>
  )
}

export default IndexPage
