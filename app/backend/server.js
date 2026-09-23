const express = require('express')
const app = express()
const port = process.env.PORT || 3000

app.use(express.json())

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' })
})

app.use('/api/patients', require('./routes/patients'))
app.use('/api/appointments', require('./routes/appointments'))

app.listen(port, () => {
  console.log(`Backend running on port ${port}`)
})