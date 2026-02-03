type RetryOptions = {
  retries?: number;
  delayMs?: number;
  backoff?: number;
  maxDelayMs?: number;
  shouldRetry?: (error: unknown) => boolean;
  onRetry?: (error: unknown, attempt: number, delayMs: number) => void;
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export function Retryable(options: RetryOptions = {}) {
  const {
    retries = 2,
    delayMs = 250,
    backoff = 2,
    maxDelayMs = 2000,
    shouldRetry = () => true,
    onRetry,
  } = options;

  return (
    _target: object,
    _propertyKey: string,
    descriptor: PropertyDescriptor,
  ) => {
    const original = descriptor.value;

    descriptor.value = async function (...args: unknown[]) {
      let attempt = 0;
      // retries is the number of re-attempts after the first call.
      while (true) {
        try {
          return await original.apply(this, args);
        } catch (error) {
          const canRetry =
            attempt < retries &&
            (typeof shouldRetry === 'function'
              ? shouldRetry.call(this, error)
              : true);
          if (!canRetry) {
            throw error;
          }

          const nextDelay = Math.min(
            delayMs * Math.pow(backoff, attempt),
            maxDelayMs,
          );

          if (onRetry) {
            try {
              onRetry.call(this, error, attempt + 1, nextDelay);
            } catch {
              // Ignore retry hook errors.
            }
          }

          await sleep(nextDelay);
          attempt += 1;
        }
      }
    };

    return descriptor;
  };
}
