import { getBaseSchema, IBaseDocument , defineModel} from '@/lib/common/models/base';

interface IBuyerDocument extends IBaseDocument {
  name: string;
  phone: string;
  email: string;
}

const BuyerSchema = getBaseSchema().add({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String, required: true },
})
export default defineModel<IBuyerDocument>("Buyer", BuyerSchema);