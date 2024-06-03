import { requestGraphInterval, updateMasPrice } from "./tools"
import { exchangeDelay, graphIntervalMs, graphShiftMs, graphStart } from "./consts";


setInterval(async () => {
  if (await updateMasPrice()) {
    console.log(` *** Updated MAS Price: ${global.masPrice} USDT`);
  } else {
    console.warn(`Could not update MAS Price`);
  }
}, exchangeDelay);


setInterval(async () => {
  const graphStart = Date.now() - graphShiftMs;
  const graphEnd = graphStart + graphIntervalMs;
  console.log(`${graphStart} -- ${graphEnd}`);
  //const tt = await requestGraphInterval(graphStart, graphEnd);
  //console.log(tt);
}, graphIntervalMs);


////  test