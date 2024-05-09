import { faker } from "@faker-js/faker";
import Buyer from "../inventory/models/buyer";


export default async function populateBuyers(number: number) {
    const buyers = [];
    for (let i = 0; i < number; i++) {
        const buyer = new Buyer({
            name: faker.person.fullName(),
            email: faker.internet.email(),
            phoneNumber: faker.phone.number()
        });
        await buyer.save();
        buyers.push(buyer);
    }
    return buyers;
}