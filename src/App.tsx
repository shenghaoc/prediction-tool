import React from 'react';
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
import faker from '@faker-js/faker';

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

const labels = ['January', 'February', 'March', 'April', 'May', 'June', 'July'];

export const data = {
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
};

export function App() {
  return (
    <div className='app-main'>
      <body>
        My price prediction tool!

        <br /><br />

        <form>
          <label> Town: </label>
          <select id="twn">
            <option value="0"> Town A </option>
            <option value="1"> Town B </option>
          </select>
        </form>

        <br />

        Floor area (sqm): <input type="number" id="fa" />

        <br /><br />

        Prediction: $<a id="output"></a>

        <br /><br />

        <button onClick={funPredict}>
          Get prediction
        </button>
      </body>
      <div className='app'>
        <Line options={options} data={data} />;
      </div>
    </div>
  )
}

function funPredict() {
  var price = +(document.getElementById("fa") as HTMLInputElement).value * 4000

  var town = +(document.getElementById("twn") as HTMLInputElement).value
  if (town == 0) {
    price = price + 100000;
  }
  else {
    price = price + 200000;
  }

  (document.getElementById("output") as HTMLOutputElement).innerHTML = String(price)
}

