'use server'

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

import dayjs, { Dayjs } from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import utc from 'dayjs/plugin/utc';
import { z } from 'zod'

dayjs.extend(customParseFormat)
dayjs.extend(utc)

let curr = dayjs.utc("2022-02", "YYYY-MM")
const ml_model_map_promise: Promise<any[]> = prisma.$queryRaw`SELECT ml_models.name, intercept_map, month_map, 
storey_range_map, floor_area_sqm_map, lease_commence_date_map,
towns_onehot.name 
AS town_name, 
towns_onehot.value 
AS town_map, 
flat_models_onehot.name 
AS flat_model_name, 
flat_models_onehot.value 
AS flat_model_map 
FROM ((ml_models 
JOIN towns_onehot 
ON ml_models.name=towns_onehot.ml_model) 
JOIN flat_models_onehot 
ON ml_models.name=flat_models_onehot.ml_model);`
const month_map_promise: Promise<any[]> = prisma.$queryRaw`SELECT name, value
FROM months_ordinal;`
const storey_range_map_promise: Promise<any[]> = prisma.$queryRaw`SELECT name, value
FROM storey_ranges_ordinal;`

import { ml_model_list } from '../lib/lists';
import { town_list } from '../lib/lists';
import { storey_range_list } from '../lib/lists';
import { flat_model_list } from '../lib/lists';

const schema = z.object({
    ml_model: z.enum(ml_model_list),
    town: z.enum(town_list),
    storey_range: z.enum(storey_range_list),
    flat_model: z.enum(flat_model_list),
    floor_area_sqm: z.number().positive('Must be greater than 0'),
    lease_commence_date: z.coerce.date().min(new Date("1960-01-01"), { message: "Must not be before 1960" })
        .max(curr.toDate(), { message: "Must not be in future" })
})

type Schema = z.output<typeof schema>
export const funPredict = async (values: Schema) => {
    const parsed = schema.parse(values)

    const full_map = (await ml_model_map_promise)
        .find((element) => element.name == parsed.ml_model
            && element.town_name == parsed.town
            && element.flat_model_name == parsed.flat_model);
    const month_map = await month_map_promise;
    const storey_range_map = await storey_range_map_promise;

    const labels = [...Array(13).keys()].reverse()
        .map(x => curr.subtract(x, 'month').format('YYYY-MM'))

    return {
        labels: labels,
        datasets: [
            {
                label: 'Trends',
                data: labels.map(x => (Math.round(Math.max(0, (full_map["intercept_map"]
                    + month_map.find(element => element.name == x).value * full_map["month_map"]
                    + full_map["town_map"]
                    + storey_range_map.find(element => element.name == parsed.storey_range).value * full_map["storey_range_map"]
                    + parsed.floor_area_sqm * full_map["floor_area_sqm_map"]
                    + full_map["flat_model_map"]
                    + dayjs(parsed.lease_commence_date).year() * full_map["lease_commence_date_map"])) * 100) / 100
                )),
                borderColor: 'rgb(53, 162, 235)',
                backgroundColor: 'rgba(53, 162, 235, 0.5)',
            },
        ],
    }
}
