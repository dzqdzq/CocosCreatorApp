Object.defineProperty(exports, "__esModule", { value: true });
require("./early-initialization");
const messages_1 = require("./messages");
const worker_message_define_1 = require("../worker-message-define");
const worker_ipc_1 = require("../utils/worker-ipc");
for (const a of worker_message_define_1.workerMessageNames) {
  if (a in messages_1.messages) {
    const b = messages_1.messages[a];
    worker_ipc_1.Worker.Ipc.on(a, (s, ...e) => {
      Promise.resolve(b(...e))
        .then((e) => {
          s.reply(null, e);
        })
        .catch((e) => {
          s.reply(e);
        });
    });
  } else {
    console.error("Worker does not accept a message called " + a);
  }
}
