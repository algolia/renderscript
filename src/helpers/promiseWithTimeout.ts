export class PromiseWithTimeoutError extends Error {}

export async function promiseWithTimeout<T>(
  promise: Readonly<Promise<T>>,
  timeout: number
): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined = undefined;
  const timeoutPromise = new Promise<T>((resolve, reject) => {
    timeoutId = setTimeout(() => {
      reject(new PromiseWithTimeoutError('Renderscript Controlled Timeout'));
    }, timeout);
  });
  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    clearTimeout(timeoutId);
  }
}
