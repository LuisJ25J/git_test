require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') })
const { Pool } = require('pg')

const adminPool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: 'postgres'
})

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
})

async function createDatabaseIfNotExists() {
  const client = await adminPool.connect()
  try {
    const check = await client.query("SELECT 1 FROM pg_database WHERE datname = 'musica_db'")
    if (check.rows.length === 0) {
      await client.query('CREATE DATABASE musica_db')
      console.log('Base de datos musica_db creada')
    } else {
      console.log('Base de datos musica_db ya existe')
    }
  } finally {
    client.release()
  }
}

async function initializeDatabase() {
  await createDatabaseIfNotExists()

  const client = await pool.connect()
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS genres (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE
      )
    `)
    await client.query(`
      CREATE TABLE IF NOT EXISTS albums (
        id SERIAL PRIMARY KEY,
        title VARCHAR(200) NOT NULL,
        artist VARCHAR(200) NOT NULL,
        songs INTEGER NOT NULL,
        genre_id INTEGER REFERENCES genres(id) ON DELETE CASCADE
      )
    `)

    const genreCount = await client.query('SELECT COUNT(*) FROM genres')
    if (parseInt(genreCount.rows[0].count, 10) === 0) {
      const genres = ['Rock', 'Pop', 'Hip-Hop', 'Jazz', 'Reggae']
      const genreIds = {}
      for (const name of genres) {
        const res = await client.query('INSERT INTO genres (name) VALUES ($1) RETURNING id', [name])
        genreIds[name] = res.rows[0].id
      }

      const albums = [
        { title: 'Abbey Road', artist: 'The Beatles', songs: 17, genre: 'Rock' },
        { title: 'Back in Black', artist: 'AC/DC', songs: 10, genre: 'Rock' },
        { title: 'The Dark side of the Moon', artist: 'Pink Floyd', songs: 10, genre: 'Rock' },
        { title: 'Thriller', artist: 'Michael Jackson', songs: 9, genre: 'Pop' },
        { title: '1989', artist: 'Taylor Swift', songs: 13, genre: 'Pop' },
        { title: 'Future Nostalgia', artist: 'Dua Lipa', songs: 11, genre: 'Pop' },
        { title: 'The Marshall Mathers LP', artist: 'Eminem', songs: 18, genre: 'Hip-Hop' },
        { title: 'To Pimp a Butterfly', artist: 'Kendrick Lamar', songs: 16, genre: 'Hip-Hop' },
        { title: 'Graduation', artist: 'Kanye West', songs: 13, genre: 'Hip-Hop' },
        { title: 'Kind of Blue', artist: 'Miles Davis', songs: 5, genre: 'Jazz' },
        { title: 'A Love Supreme', artist: 'Jhon Coltrane', songs: 4, genre: 'Jazz' },
        { title: 'Time Out', artist: 'Dave Brubeck Quartet', songs: 7, genre: 'Jazz' },
        { title: 'Legend', artist: 'Bob Marley & The Wailers', songs: 14, genre: 'Reggae' },
        { title: 'Dreadlocks the Time is Now', artist: 'Burning Spear', songs: 10, genre: 'Reggae' },
        { title: 'True Democracy', artist: 'Steel Pulse', songs: 10, genre: 'Reggae' }
      ]

      for (const a of albums) {
        await client.query(
          'INSERT INTO albums (title, artist, songs, genre_id) VALUES ($1, $2, $3, $4)',
          [a.title, a.artist, a.songs, genreIds[a.genre]]
        )
      }
    }
  } catch (e) {
    console.error('Error inicializando la base de datos:', e.message)
  } finally {
    client.release()
  }
}

module.exports = { pool, initializeDatabase }
