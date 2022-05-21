const express = require('express')
const app = express()
const port = process.env.PORT || 5000

app.get('/', (req, res) => {
  res.send('Ak computer parts house start')
})

app.listen(port, () => {
  console.log(`Ak computer parts house ${port}`)
})