require('dotenv').config({ path: require('path').join(__dirname, '.env') })
const express = require('express')
const { initializeDatabase } = require('./src/config/db')
const genresRoutes = require('./src/routes/genres')
const albumsRoutes = require('./src/routes/albums')

const app = express()
const PORT = process.env.PORT || 3000

app.use(express.json())

app.use('/api/genres', genresRoutes)
app.use('/api/albums', albumsRoutes)

initializeDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Servidor en http://localhost:${PORT}`)
    })
  })
  .catch((e) => {
    console.error('Error iniciando el servidor:', e.message)
    process.exit(1)
  })

module.exports = app
