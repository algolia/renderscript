import { wait } from './src/helpers/wait';

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export default async function setup() {
  const max = 50;
  let curr = 0;

  while (curr < max) {
    curr += 1;
    try {
      const res = await fetch('http://localhost:3000/ready');
      console.log('API statusCode:', res.status, `(retries: ${curr})`);

      if (res.status === 200) {
        console.log('API Ready');
        return;
      }
    } catch (err: any) {
      console.log(err.message);
    } finally {
      await wait(1000);
    }
  }

  throw Error('API did not reach ready status');
}
