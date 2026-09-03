const crypto = require('crypto')
const fs = require('fs')
const path = require('path')
const express = require('express')
const cors = require('cors')
const mysql = require('mysql')

loadEnv()

const app = express()
const PORT = process.env.PORT || 5000

app.use(cors())
app.use(express.json())

const db = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  connectionLimit: Number(process.env.DB_CONNECTION_LIMIT)
})

function loadEnv() {
  const envPath = path.join(__dirname, '.env')

  if (!fs.existsSync(envPath)) {
    return
  }

  const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/)

  lines.forEach(line => {
    const trimmedLine = line.trim()

    if (!trimmedLine || trimmedLine.startsWith('#')) {
      return
    }

    const separatorIndex = trimmedLine.indexOf('=')

    if (separatorIndex === -1) {
      return
    }

    const key = trimmedLine.slice(0, separatorIndex).trim()
    let value = trimmedLine.slice(separatorIndex + 1).trim()

    if (!key || process.env[key] !== undefined) {
      return
    }

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }

    process.env[key] = value
  })
}

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex')
}

function accountResponse(account) {
  return {
    id: account.id,
    fname: account.fname,
    lname: account.lname,
    email: account.email,
    avatar_id: account.avatar_id
  }
}

function query(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (error, results) => {
      if (error) {
        reject(error)
        return
      }

      resolve(results)
    })
  })
}

function getConnection() {
  return new Promise((resolve, reject) => {
    db.getConnection((error, connection) => {
      if (error) {
        reject(error)
        return
      }

      resolve(connection)
    })
  })
}

function run(connection, sql, params = []) {
  return new Promise((resolve, reject) => {
    connection.query(sql, params, (error, results) => {
      if (error) {
        reject(error)
        return
      }

      resolve(results)
    })
  })
}

function beginTransaction(connection) {
  return new Promise((resolve, reject) => {
    connection.beginTransaction(error => {
      if (error) {
        reject(error)
        return
      }

      resolve()
    })
  })
}

function commit(connection) {
  return new Promise((resolve, reject) => {
    connection.commit(error => {
      if (error) {
        reject(error)
        return
      }

      resolve()
    })
  })
}

function rollback(connection) {
  return new Promise(resolve => {
    connection.rollback(() => resolve())
  })
}

function sendServerError(res, error) {
  console.error(error)
  res.status(500).json({ message: 'Blad serwera' })
}

app.get('/', (req, res) => {
  res.json({
    message: 'Hecto Shop API dziala',
    endpoints: {
      products: 'GET /products',
      register: 'POST /auth/register',
      login: 'POST /auth/login',
      createOrder: 'POST /orders',
      accountOrders: 'GET /accounts/:accountId/orders'
    }
  })
})

app.get(['/products', '/prod'], async (req, res) => {
  try {
    const products = await query(
      `SELECT
        p.id,
        p.prod_name,
        p.cost,
        p.description,
        p.image_link,
        p.genre_id,
        g.genre_name,
        g.genre_color
      FROM products p
      LEFT JOIN genres g ON g.id = p.genre_id
      ORDER BY p.id DESC`
    )

    res.json(products)
  } catch (error) {
    sendServerError(res, error)
  }
})

app.get('/products/:id', async (req, res) => {
  try {
    const [product] = await query(
      `SELECT
        p.id,
        p.prod_name,
        p.cost,
        p.description,
        p.image_link,
        p.genre_id,
        g.genre_name,
        g.genre_color
      FROM products p
      LEFT JOIN genres g ON g.id = p.genre_id
      WHERE p.id = ?`,
      [req.params.id]
    )

    if (!product) {
      res.status(404).json({ message: 'Produkt nie istnieje' })
      return
    }

    res.json(product)
  } catch (error) {
    sendServerError(res, error)
  }
})

app.post('/auth/register', async (req, res) => {
  const { fname, lname, email, password, avatar_id = 1 } = req.body

  if (!fname || !lname || !email || !password) {
    res.status(400).json({ message: 'Podaj fname, lname, email i password' })
    return
  }

  try {
    const existingAccounts = await query(
      'SELECT id FROM accounts WHERE email = ? LIMIT 1',
      [email]
    )

    if (existingAccounts.length > 0) {
      res.status(409).json({ message: 'Konto z takim emailem juz istnieje' })
      return
    }

    const result = await query(
      `INSERT INTO accounts (fname, lname, email, password, avatar_id)
      VALUES (?, ?, ?, ?, ?)`,
      [fname, lname, email, hashPassword(password), avatar_id]
    )

    res.status(201).json({
      message: 'Konto utworzone',
      account: {
        id: result.insertId,
        fname,
        lname,
        email,
        avatar_id
      }
    })
  } catch (error) {
    sendServerError(res, error)
  }
})

app.post('/auth/login', async (req, res) => {
  const { email, password } = req.body

  if (!email || !password) {
    res.status(400).json({ message: 'Podaj email i password' })
    return
  }

  try {
    const [account] = await query(
      'SELECT * FROM accounts WHERE email = ? LIMIT 1',
      [email]
    )

    if (!account) {
      res.status(401).json({ message: 'Nieprawidlowy email lub haslo' })
      return
    }

    const passwordHash = hashPassword(password)
    const passwordMatches = account.password === passwordHash || account.password === password

    if (!passwordMatches) {
      res.status(401).json({ message: 'Nieprawidlowy email lub haslo' })
      return
    }

    if (account.password === password) {
      await query('UPDATE accounts SET password = ? WHERE id = ?', [passwordHash, account.id])
    }

    res.json({
      message: 'Zalogowano',
      account: accountResponse(account)
    })
  } catch (error) {
    sendServerError(res, error)
  }
})

app.post('/orders', async (req, res) => {
  const { acc_id, accountId, prod_id, productId, product_ids, productIds, products } = req.body
  const accountIdValue = acc_id || accountId
  let productIdList = []

  if (Array.isArray(products)) {
    productIdList = products.flatMap(product => {
      const id = product.id || product.prod_id || product.productId
      const quantity = Number(product.quantity || 1)

      if (!id || Number.isNaN(quantity) || quantity < 1) {
        return []
      }

      return Array.from({ length: quantity }, () => id)
    })
  } else if (Array.isArray(product_ids)) {
    productIdList = product_ids
  } else if (Array.isArray(productIds)) {
    productIdList = productIds
  } else if (prod_id || productId) {
    productIdList = [prod_id || productId]
  }

  productIdList = productIdList.map(id => Number(id)).filter(id => Number.isInteger(id) && id > 0)

  if (!accountIdValue || productIdList.length === 0) {
    res.status(400).json({
      message: 'Podaj acc_id oraz prod_id, product_ids albo products'
    })
    return
  }

  let connection

  try {
    connection = await getConnection()
    await beginTransaction(connection)

    const accounts = await run(connection, 'SELECT id FROM accounts WHERE id = ? LIMIT 1', [
      accountIdValue
    ])

    if (accounts.length === 0) {
      await rollback(connection)
      res.status(404).json({ message: 'Konto nie istnieje' })
      return
    }

    const uniqueProductIds = [...new Set(productIdList)]
    const existingProducts = await run(
      connection,
      'SELECT id FROM products WHERE id IN (?)',
      [uniqueProductIds]
    )
    const existingProductIds = new Set(existingProducts.map(product => product.id))
    const missingProductIds = uniqueProductIds.filter(id => !existingProductIds.has(id))

    if (missingProductIds.length > 0) {
      await rollback(connection)
      res.status(404).json({
        message: 'Niektore produkty nie istnieja',
        missingProductIds
      })
      return
    }

    const values = productIdList.map(id => [id, accountIdValue, 'nowe'])
    const result = await run(
      connection,
      'INSERT INTO orders (prod_id, acc_id, date_ord, status) VALUES ?',
      [values.map(([product, account, status]) => [product, account, new Date(), status])]
    )

    await commit(connection)

    res.status(201).json({
      message: 'Zamowienie utworzone',
      orderIds: Array.from({ length: result.affectedRows }, (_, index) => result.insertId + index),
      accountId: Number(accountIdValue),
      productIds: productIdList,
      status: 'nowe'
    })
  } catch (error) {
    if (connection) {
      await rollback(connection)
    }

    sendServerError(res, error)
  } finally {
    if (connection) {
      connection.release()
    }
  }
})

app.get('/accounts/:accountId/orders', async (req, res) => {
  try {
    const orders = await query(
      `SELECT
        o.id,
        o.prod_id,
        o.acc_id,
        o.date_ord,
        o.status,
        p.prod_name,
        p.cost,
        p.description,
        p.image_link,
        p.genre_id,
        g.genre_name,
        g.genre_color
      FROM orders o
      JOIN products p ON p.id = o.prod_id
      LEFT JOIN genres g ON g.id = p.genre_id
      WHERE o.acc_id = ?
      ORDER BY o.date_ord DESC, o.id DESC`,
      [req.params.accountId]
    )

    res.json(orders)
  } catch (error) {
    sendServerError(res, error)
  }
})

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`)
})
