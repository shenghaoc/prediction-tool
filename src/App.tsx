import React, { useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { faker } from '@faker-js/faker';
import $ from 'jquery';
import {
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  InputAdornment,
  OutlinedInput,
  TextField,
  Stack,
  Typography
} from "@mui/material";
import { DateTime } from "luxon";
import AdapterLuxon from '@mui/lab/AdapterLuxon';
import LocalizationProvider from '@mui/lab/LocalizationProvider';
import DatePicker from '@mui/lab/DatePicker';
import * as tf from '@tensorflow/tfjs';
import town_list from './town.json';
import flat_type_list from './flat_type.json';
import storey_range_list from './storey_range.json';
import flat_model_list from './flat_model.json';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export const options = {
  responsive: true,
  plugins: {
    legend: {
      position: 'top' as const,
    },
    title: {
      display: true,
      text: 'Chart.js Line Chart',
    },
  },
};

const labels = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];

let model: tf.LayersModel;

async function loadModel() {
  if (model == null) {
    model = await tf.loadLayersModel(
      'https://storage.googleapis.com/tfjs-models/tfjs/iris_v1/model.json');
    model.summary();
  }
}

export function App() {
  const [values, setValues] = React.useState({
    town: '',
    flat_type: '',
    storey_range: '',
    floor_area_sqm: '',
    flat_model: '',
    resale_price: '',
  });

  const [leaseCommenceDate, setLeaseCommenceDate] = React.useState<DateTime | null>(null);


  const handleChange = (prop: any) => (event: any) => {
    setValues({ ...values, [prop]: event.target.value });
  };


  const [data, setData] = useState({
    labels,
    datasets: [
      {
        label: 'Dataset 1',
        data: labels.map(() => faker.datatype.number({ min: -1000, max: 1000 })),
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
      },
      {
        label: 'Dataset 2',
        data: labels.map(() => faker.datatype.number({ min: -1000, max: 1000 })),
        borderColor: 'rgb(53, 162, 235)',
        backgroundColor: 'rgba(53, 162, 235, 0.5)',
      },
    ],
  });

  function funPredict() {
    let dataQuery = {
      resource_id: 'f1765b54-a209-4718-8d38-a39237f502b3', // the resource id
      fields: "month, resale_price", // other useful parameters: filters, sort
      filters: "{\"town\": \"" + values.town + "\", \"flat_type\": \"" + values.flat_type + "\", \"storey_range\": \"" + values.storey_range + "\", \"flat_model\": \"" + values.flat_model + "\", \"lease_commence_date\": \"" + leaseCommenceDate?.year + "\"}",
      limit: 12, // get 12 results
    };

    $.ajax({
      url: 'https://data.gov.sg/api/action/datastore_search',
      data: dataQuery,
      dataType: 'jsonp',
      cache: true,
      success: async function (data) {
        await loadModel();
        (model.predict(tf.ones([1, 4])) as tf.Tensor).print();
        alert('Total results found: ' + data.result.total)
        console.log(data.result.records)
        setData({
          labels: data.result.records.map((record: { month: any; }) => record.month),
          datasets: [
            {
              label: 'Test',
              data: data.result.records.map((record: { resale_price: any; }) => record.resale_price),
              borderColor: 'rgb(0, 0, 0)',
              backgroundColor: 'rgba(1, 2, 132, 0.5)',
            },
          ],
        })
      }
    });

    let price = +values.floor_area_sqm * 4000;

    let town = +values.town;
    if (town === 0) {
      price = price + 100000;
    }
    else {
      price = price + 200000;
    }

    (document.getElementById("output") as HTMLOutputElement).innerHTML = String(price)
  }

  return (
    <Box>
      <Typography variant="h2" component="div" gutterBottom>
        Price Prediction
      </Typography>
      <LocalizationProvider dateAdapter={AdapterLuxon}>
        <Stack spacing={3}>
          <FormControl fullWidth>
            <InputLabel>Town</InputLabel>
            <Select value={values.town} onChange={handleChange('town')}>
              {town_list.sort().map((town: string) => (
                <MenuItem
                  key={town}
                  value={town}
                >
                  {town}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth>
            <InputLabel>Flat Type</InputLabel>
            <Select value={values.flat_type} onChange={handleChange('flat_type')}>
              {flat_type_list.sort().map((flat_type: string) => (
                <MenuItem
                  key={flat_type}
                  value={flat_type}
                >
                  {flat_type}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth>
            <InputLabel>Storey Range</InputLabel>
            <Select value={values.storey_range} onChange={handleChange('storey_range')}>
              {storey_range_list.sort().map((storey_range: string) => (
                <MenuItem
                  key={storey_range}
                  value={storey_range}
                >
                  {storey_range}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth>
            <InputLabel>Flat Model</InputLabel>
            <Select value={values.flat_model} onChange={handleChange('flat_model')}>
              {flat_model_list.sort().map((flat_model: string) => (
                <MenuItem
                  key={flat_model}
                  value={flat_model}
                >
                  {flat_model}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth>
            <InputLabel htmlFor="outlined-adornment-amount">Floor area</InputLabel>
            <OutlinedInput
              onChange={handleChange('floor_area_sqm')}
              endAdornment={<InputAdornment position="end">m<sup>2</sup></InputAdornment>}
            />
          </FormControl>
          <DatePicker
            label="Lease commence date"
            views={['year']}
            value={leaseCommenceDate}
            onChange={(newValue) => {
              setLeaseCommenceDate(newValue);
            }}
            renderInput={(params) => <TextField {...params} fullWidth />}
          />
          <Box
            sx={{
              bgcolor: 'background.paper',
              boxShadow: 1,
              borderRadius: 1,
              p: 2,
              minWidth: 300,
              py: 2
            }}
          >
            <Box component="div" sx={{ display: 'inline' }}>
              <Typography variant="overline" display="block" gutterBottom>
                Prediction
              </Typography>
              <Typography variant="h2" gutterBottom>
                $<span id="output">0</span>
              </Typography>
            </Box>
          </Box>
          <Button variant="contained"
            onClick={funPredict}>
            Get prediction
          </Button>
        </Stack>
        <Line options={options} data={data} />
      </LocalizationProvider>
    </Box>
  )
}

