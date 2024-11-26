const { RoundRobin } = require("./roundrobin.js");

const factory = () => ({
  instance: factory.counter ? ++factory.counter : (factory.counter = 1),
});

const main = async () => {
  const collection = new RoundRobin(factory, { size: 3 });
  const promises = [];
  for (let i = 0; i < 5; i++) {
    const instance = collection.getInstance();
    promises.push(instance);
  }
  Promise.all(promises);
};

main();