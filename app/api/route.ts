import ml_model_map from '../../public/ml_model.json'
import storey_range_map from '../../public/storey_range.json';
import town_list from '../../public/town.json';
import flat_model_list from '../../public/flat_model.json';

const ml_model_list = Object.keys(ml_model_map)
const storey_range_list = Object.keys(storey_range_map)

export async function GET() {
    return Response.json(({ ml_model_list, town_list, storey_range_list, flat_model_list }))
}