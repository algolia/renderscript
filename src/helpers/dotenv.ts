export default () => {
  if (process.env.NODE_ENV === "development") {
    require("dotenv-safe").config({ allowEmptyValues: true });
  }
};
