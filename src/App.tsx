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
  NativeSelect,
  Box,
  InputAdornment,
  OutlinedInput,
  TextField,
  Stack,
  Typography
} from "@mui/material";
import dayjs, { Dayjs } from 'dayjs';
import AdapterDayjs from '@mui/lab/AdapterDayjs';
import LocalizationProvider from '@mui/lab/LocalizationProvider';
import DatePicker from '@mui/lab/DatePicker';

import url_map from'./url.json'
import town_list from './town.json';
import flat_type_list from './flat_type.json';
import storey_range_list from './storey_range.json';
import flat_model_list from './flat_model.json';

import customParseFormat from 'dayjs/plugin/customParseFormat';
dayjs.extend(customParseFormat)

const ml_model_list = Object.keys(url_map).sort()
town_list.sort()
flat_type_list.sort()
storey_range_list.sort()
flat_model_list.sort()

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
      text: 'Predicted Trends for Past 12 Months',
    },
  },
};

let curr = dayjs()
let curr_minus_1_year = curr.add(1, 'year')
// @ts-ignore
const labels = [...Array(12).keys()]
  .map(x => curr_minus_1_year.add(x, 'month').format('YYYY-MM'))

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

  const [leaseCommenceDate, setLeaseCommenceDate] = useState< Dayjs | null>(null);


  const handleChange = (prop: any) => (event: any) => {
    setValues({ ...values, [prop]: event.target.value });
  };


  const [data, setData] = useState({
    labels,
    datasets: [
      {
        label: 'Sample Trends',
        data: labels.map(() => faker.datatype.number({ min: 0, max: 1000 })),
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
      }
    ],
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
      alert("Missing Lease Commencement Date!")
      return;
    }

    let dataQuery = {
      resource_id: 'f1765b54-a209-4718-8d38-a39237f502b3', // the resource id
      fields: "month, resale_price", // other useful parameters: filters, sort
      filters: "{\"town\": \"" + values.town + "\", \"flat_type\": \"" + values.flat_type + "\", \"storey_range\": \"" + values.storey_range + "\", \"flat_model\": \"" + values.flat_model + "\", \"lease_commence_date\": \"" + leaseCommenceDate?.year + "\"}",
    };

    $.ajax({
      url: 'https://data.gov.sg/api/action/datastore_search',
      data: dataQuery,
      dataType: 'jsonp',
      cache: true,
      success: async function (data) {
        let tmp = data.result.records.length;
        (document.getElementById("past") as HTMLOutputElement).innerHTML = (tmp === 100) ? '≥' + tmp : tmp;
        console.log(data.result.records)
      }
    });
    const INPUT_DATA_FILE = {
      "data": [],
      "method": "predict"
    }

    for (let i = 0; i <= 12; i++) {
      let tmp = [i === 12 ? curr.format('YYYY-MM') : labels[i], values.town, values.storey_range, Number(values.floor_area_sqm),
          values.flat_model, leaseCommenceDate?.year]
      if (i === 0) {
        // @ts-ignore
        INPUT_DATA_FILE["data"] = [tmp]
      } else
        { // @ts-ignore
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
          (document.getElementById("output") as HTMLOutputElement).innerHTML = data["predict"].pop()
              .toFixed(2).toString()
          setData({
            labels: labels,
            datasets: [
                {
                  label: 'Trends',
                  data: data["predict"],
                  borderColor: 'rgb(53, 162, 235)',
                  backgroundColor: 'rgba(53, 162, 235, 0.5)',
                },
            ],
          })
        },
        contentType: "application/json"
      });
  }

  return (
    <Box>
      <Typography variant="h2" component="div" gutterBottom>
        Price Prediction
      </Typography>
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <Stack spacing={3}>
          <FormControl fullWidth>
            <InputLabel>ML Model</InputLabel>
            <NativeSelect value={values.ml_model} onChange={handleChange('ml_model')}>
              {ml_model_list.map((ml_model: string) => (
                  <option
                      key={ml_model}
                      value={ml_model}
                  >
                    {ml_model}
                  </option>
              ))}
            </NativeSelect>
          </FormControl>
          <FormControl fullWidth>
            <InputLabel>Town</InputLabel>
            <NativeSelect value={values.town} onChange={handleChange('town')}>
              {town_list.map((town: string) => (
                <option
                  key={town}
                  value={town}
                >
                  {town}
                </option>
              ))}
            </NativeSelect>
          </FormControl>
          <FormControl fullWidth>
            <InputLabel>Flat Type</InputLabel>
            <NativeSelect value={values.flat_type} onChange={handleChange('flat_type')}>
              {flat_type_list.map((flat_type: string) => (
                <option
                  key={flat_type}
                  value={flat_type}
                >
                  {flat_type}
                </option>
              ))}
            </NativeSelect>
          </FormControl>
          <FormControl fullWidth>
            <InputLabel>Storey Range</InputLabel>
            <NativeSelect value={values.storey_range} onChange={handleChange('storey_range')}>
              {storey_range_list.map((storey_range: string) => (
                <option
                  key={storey_range}
                  value={storey_range}
                >
                  {storey_range}
                </option>
              ))}
            </NativeSelect>
          </FormControl>
          <FormControl fullWidth>
            <InputLabel>Flat Model</InputLabel>
            <NativeSelect value={values.flat_model} onChange={handleChange('flat_model')}>
              {flat_model_list.map((flat_model: string) => (
                <option
                  key={flat_model}
                  value={flat_model}
                >
                  {flat_model}
                </option>
              ))}
            </NativeSelect>
          </FormControl>
          <FormControl fullWidth>
            <InputLabel htmlFor="outlined-adornment-amount">Floor area</InputLabel>
            <OutlinedInput
              type = "number"
              inputProps={{ min: "0" }}
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
            minDate={dayjs('1960', 'YYYY')}
            disableFuture={true}
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
            <Box sx={{ color: 'text.secondary', display: 'inline', fontSize: 12 }}>
              <Typography variant="body1" gutterBottom>
                <span id="past">0</span> matching entries on record
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

