const express = require('express')
const { pool } = require('../config/db')

const router = express.Router()

router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT a.id, a.title, a.artist, a.songs, a.genre_id, g.name AS genre_name
      FROM albums a
      LEFT JOIN genres g ON a.genre_id = g.id
      ORDER BY a.id
    `)
    res.json(result.rows)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT a.id, a.title, a.artist, a.songs, a.genre_id, g.name AS genre_name
      FROM albums a
      LEFT JOIN genres g ON a.genre_id = g.id
      WHERE a.id = $1
    `, [req.params.id])
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Álbum no encontrado' })
    }
    res.json(result.rows[0])
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

router.post('/', async (req, res) => {
  try {
    const { title, artist, songs, genre_id } = req.body
    if (!title || !artist || songs === undefined || !genre_id) {
      return res.status(400).json({ error: 'title, artist, songs y genre_id son requeridos' })
    }
    const result = await pool.query(
      'INSERT INTO albums (title, artist, songs, genre_id) VALUES ($1, $2, $3, $4) RETURNING *',
      [title, artist, songs, genre_id]
    )
    res.status(201).json(result.rows[0])
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

router.put('/:id', async (req, res) => {
  try {
    const { title, artist, songs, genre_id } = req.body
    if (!title || !artist || songs === undefined || !genre_id) {
      return res.status(400).json({ error: 'title, artist, songs y genre_id son requeridos' })
    }
    const result = await pool.query(
      'UPDATE albums SET title = $1, artist = $2, songs = $3, genre_id = $4 WHERE id = $5 RETURNING *',
      [title, artist, songs, genre_id, req.params.id]
    )
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Álbum no encontrado' })
    }
    res.json(result.rows[0])
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM albums WHERE id = $1 RETURNING *', [req.params.id])
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Álbum no encontrado' })
    }
    res.json({ message: 'Álbum eliminado', deleted: result.rows[0] })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

module.exports = router
