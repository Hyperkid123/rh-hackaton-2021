import express from 'express';

const PORT = 3000;
const app = express();

app.get('/', (req, res) => {
  res.send('I am here')
})

app.listen(PORT, () => {
  console.log(`Server started at http://localhost:${PORT}`)
})
