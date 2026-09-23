const router = require('express').Router()

router.get('/', (req, res) => {
  res.json({ message: 'Patients endpoint' })
})

module.exports = router