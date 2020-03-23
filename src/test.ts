(async () => {
  while (true) {
    console.log('.');
    await new Promise((resolve) => setTimeout(resolve, 10000));
  }
})();
