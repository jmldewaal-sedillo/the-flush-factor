// Adres van de testserver. De tests hebben een eigen poort, los van `npm run serve` (5000 en verder),
// zodat een server die je zelf hebt openstaan en de tests elkaar nooit in de weg zitten.
const PORT = Number(process.env.TEST_PORT || 5599);
const PATH = '/the-flush-factor/';

module.exports = { PORT, PATH, BASE: `http://localhost:${PORT}${PATH}` };
