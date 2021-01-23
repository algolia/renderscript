/* eslint-disable @typescript-eslint/no-var-requires */
export default (): void => {
  if (process.env.NODE_ENV === 'development') {
    require('dotenv-safe').config({ allowEmptyValues: true });
  }
};
