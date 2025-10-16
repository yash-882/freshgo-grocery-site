// List of BullMQ queues

import { emailQueue } from "../queues/email.js";
import { orderQueue } from "../queues/order.js";

export default {
orderQueue, //queue name ("orderQueue")
emailQueue
}