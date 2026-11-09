const express = require('express')
const { pool } = require('../config/db')

const router = express.Router()

router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM genres ORDER BY id')
    res.json(result.rows)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM genres WHERE id = $1', [req.params.id])
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Género no encontrado' })
    }
    res.json(result.rows[0])
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

router.post('/', async (req, res) => {
  try {
    const { name } = req.body
    if (!name) {
      return res.status(400).json({ error: 'El nombre es requerido' })
    }
    const result = await pool.query('INSERT INTO genres (name) VALUES ($1) RETURNING *', [name])
    res.status(201).json(result.rows[0])
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

router.put('/:id', async (req, res) => {
  try {
    const { name } = req.body
    if (!name) {
      return res.status(400).json({ error: 'El nombre es requerido' })
    }
    const result = await pool.query('UPDATE genres SET name = $1 WHERE id = $2 RETURNING *', [name, req.params.id])
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Género no encontrado' })
    }
    res.json(result.rows[0])
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM genres WHERE id = $1 RETURNING *', [req.params.id])
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Género no encontrado' })
    }
    res.json({ message: 'Género eliminado', deleted: result.rows[0] })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

module.exports = router
