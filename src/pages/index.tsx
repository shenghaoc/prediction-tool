import React, {useState} from 'react';
import { Helmet } from "react-helmet"
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
import town_list from '../../content/town.json';
import storey_range_list from '../../content/storey_range.json';
import flat_model_list from '../../content/flat_model.json';

import customParseFormat from 'dayjs/plugin/customParseFormat';

dayjs.extend(customParseFormat)

const {Option} = Select;
const {Title} = Typography;

const ml_model_list = Object.keys(url_map).sort()
town_list.sort()
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

    const INPUT_DATA_FILE = {
      "data": [],
      "method": "predict"
    }

    for (let i = 0; i <= 12; i++) {
      let tmp = [i === 12 ? values.month.format('YYYY-MM') : labels[i], values.town, values.storey_range, Number(values.floor_area_sqm),
        values.flat_model, values.lease_commence_date.year()]
      if (i === 0) {
        // @ts-ignore
        INPUT_DATA_FILE["data"] = [tmp]
      } else { // @ts-ignore
        INPUT_DATA_FILE["data"].push(tmp)
      }
    }

    // @ts-ignore
    fetch(url_map[values.ml_model], {
      method: 'POST', // or 'PUT'
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(INPUT_DATA_FILE),
    })
      .then(response => {
        if (!response.ok) {
          alert('Server Down')
          throw new Error('Network response was not OK');
        }
        return response.json();
      })
      .then(data => {
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
      })
      .catch((error) => {
        console.error('Error:', error);
      });
  }

  type SizeType = Parameters<typeof Form>[0]['size'];

  const [componentSize, setComponentSize] = useState<SizeType | 'default'>('default');
  const onFormLayoutChange = ({size}: { size: SizeType }) => {
    setComponentSize(size);
  };

  return (
    <main style={{padding: `24px`}}>
      <Helmet>
        <meta charSet="utf-8" />
        <title>Prediction Tool</title>
        <link rel="canonical" href="https://ee4802-g20-tool.web.app" />
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
