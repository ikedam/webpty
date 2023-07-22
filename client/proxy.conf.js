const proxy = {
  '/api': {
    target: 'http://server:8080',
    ws: true
  }
};

module.exports = proxy;
