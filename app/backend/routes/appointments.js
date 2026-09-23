const router = require('express').Router()

router.get('/', (req, res) => {
  res.json({ message: 'Appointments endpoint' })
})

module.exports = router