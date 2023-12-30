'use server'

import month_map from '../public/month.json'
import ml_model_map from '../public/ml_model.json'
import town_list from '../public/town.json'
import storey_range_map from '../public/storey_range.json';
import flat_model_list from '../public/flat_model.json'

import dayjs, { Dayjs } from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import utc from 'dayjs/plugin/utc';
import { z } from 'zod'

dayjs.extend(customParseFormat)
dayjs.extend(utc)

let curr = dayjs.utc("2022-02", "YYYY-MM")
const schema = z.object({
    ml_model: z.custom<string>((val) => Object.keys(ml_model_map).includes(val as string)),
    town: z.custom<string>((val) => town_list.includes(val as string)),
    storey_range: z.custom<string>((val) => Object.keys(storey_range_map).includes(val as string)),
    flat_model: z.custom<string>((val) => flat_model_list.includes(val as string)),
    floor_area_sqm: z.number().positive('Must be greater than 0'),
    lease_commence_date: z.coerce.date().min(new Date("1960-01-01"), { message: "Must not be before 1960" })
        .max(curr.toDate(), { message: "Must not be in future" })
})

type Schema = z.output<typeof schema>

export async function funPredict(values: Schema) {
    const parsed = schema.parse(values)

    let labels = [...Array(13).keys()].reverse()
        .map(x => curr.subtract(x, 'month').format('YYYY-MM'))

    let mapping_map = ml_model_map[parsed.ml_model as keyof typeof ml_model_map]["mapping"];
    return {
        labels: labels,
        datasets: [
            {
                label: 'Trends',
                data: labels.map(x => (Math.round(Math.max(0, (mapping_map["intercept"]
                    + month_map[x as keyof typeof month_map] * mapping_map["month"]
                    + mapping_map["town"][parsed.town as keyof typeof mapping_map["town"]]
                    + storey_range_map[parsed.storey_range as keyof typeof storey_range_map] * mapping_map["storey_range"]
                    + parsed.floor_area_sqm * mapping_map["floor_area_sqm"]
                    + mapping_map["flat_model"][parsed.flat_model as keyof typeof mapping_map["flat_model"]]
                    + dayjs(parsed.lease_commence_date).year() * mapping_map["lease_commence_date"])) * 100) / 100
                )),
                borderColor: 'rgb(53, 162, 235)',
                backgroundColor: 'rgba(53, 162, 235, 0.5)',
            },
        ],
    }
}
