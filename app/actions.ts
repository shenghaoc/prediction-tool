'use server'

import month_map from '../public/month.json'
import ml_model_map from '../public/ml_model.json'
import storey_range_map from '../public/storey_range.json';

import dayjs, { Dayjs } from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import { FieldType } from './page';

dayjs.extend(customParseFormat)

let curr = dayjs("2022-02", "YYYY-MM")


export async function funPredict(values: FieldType) {
    let labels = [...Array(13).keys()].reverse()
        .map(x => curr.subtract(x, 'month').format('YYYY-MM'))

    let mapping_map = ml_model_map[values.ml_model as keyof typeof ml_model_map]["mapping"];
    return {
        labels: labels,
        datasets: [
            {
                label: 'Trends',
                data: labels.map(x => (Math.round((mapping_map["intercept"]
                    + month_map[x as keyof typeof month_map] * mapping_map["month"]
                    + mapping_map["town"][values.town as keyof typeof mapping_map["town"]]
                    + storey_range_map[values.storey_range as keyof typeof storey_range_map] * mapping_map["storey_range"]
                    + values.floor_area_sqm * mapping_map["floor_area_sqm"]
                    + mapping_map["flat_model"][values.flat_model as keyof typeof mapping_map["flat_model"]]
                    + dayjs(values.lease_commence_date).year() * mapping_map["lease_commence_date"]) * 100) / 100
                )),
                borderColor: 'rgb(53, 162, 235)',
                backgroundColor: 'rgba(53, 162, 235, 0.5)',
            },
        ],
    }
}
