
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mysql = require('mysql2/promise');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const csv = require('fast-csv');
const exceljs = require('exceljs');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
const port = 3001;
const JWT_SECRET = 'your_jwt_secret'; 

app.use(cors());
app.use(bodyParser.json());

const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}
const upload = multer({ dest: uploadDir });

const dbConfig = {
    host: 'localhost',
    user: 'user', 
    password: 'password', 
    database: 'sustainability_db' 
};

let db;

async function connectToDatabase() {
    try {
        db = await mysql.createConnection(dbConfig);
        console.log('Successfully connected to the MySQL database.');
    } catch (error) {
        console.error('Error connecting to MySQL database:', error);
        process.exit(1);
    }
}

connectToDatabase();

const handleDbError = (res, error, message = 'An internal server error occurred.') => {
    console.error(error);
    if (res.headersSent) return;
    return res.status(500).json({ error: message });
};

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) return res.sendStatus(401); 

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

app.post('/api/register', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const [result] = await db.execute(
            'INSERT INTO users (email, password) VALUES (?, ?)',
            [email, hashedPassword]
        );

        res.status(201).json({ id: result.insertId, email });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ error: 'This email is already registered.' });
        }
        handleDbError(res, error, 'Failed to register user.');
    }
});

app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const [rows] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);

        if (rows.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const user = rows[0];
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '1h' });
        res.json({ token });

    } catch (error) {
        handleDbError(res, error, 'Failed to login.');
    }
});

app.get('/api/products', async (req, res) => {
    try {
        const { page = 1, limit = 10, sortBy = 'id', sortOrder = 'asc', search = '', category = '' } = req.query;

        const offset = (page - 1) * limit;
        const validSortBy = ['id', 'name', 'price'];
        const sortColumn = validSortBy.includes(sortBy) ? sortBy : 'id';
        const sortDirection = sortOrder.toLowerCase() === 'desc' ? 'DESC' : 'ASC';

        let whereClauses = [];
        let params = [];

        if (search) {
            whereClauses.push('p.name LIKE ?');
            params.push(`%${search}%`);
        }

        if (category) {
            whereClauses.push('c.name = ?');
            params.push(category);
        }

        const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

        const countSql = `SELECT COUNT(*) as total FROM products p JOIN categories c ON p.categoryId = c.id ${whereSql}`;
        const [countRows] = await db.execute(countSql, params);
        const total = countRows[0].total;

        const dataSql = `
            SELECT p.id, p.name, p.price, p.description, p.imageUrl, c.name as categoryName
            FROM products p
            JOIN categories c ON p.categoryId = c.id
            ${whereSql}
            ORDER BY ${sortColumn} ${sortDirection}
            LIMIT ?
            OFFSET ?
        `;

        const [products] = await db.execute(dataSql, [...params, parseInt(limit), parseInt(offset)]);

        res.json({
            data: products,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        handleDbError(res, error, 'Failed to retrieve products.');
    }
});

app.get('/api/products/:id', async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT * FROM products WHERE id = ?', [req.params.id]);
        if (rows.length > 0) {
            res.json(rows[0]);
        } else {
            res.status(404).send('Product not found');
        }
    } catch (error) {
        handleDbError(res, error, 'Failed to retrieve the product.');
    }
});

app.post('/api/products', authenticateToken, async (req, res) => {
    try {
        const { name, categoryId, price, description, imageUrl } = req.body;
        const [result] = await db.execute(
            'INSERT INTO products (name, categoryId, price, description, imageUrl) VALUES (?, ?, ?, ?, ?)',
            [name, categoryId, price, description, imageUrl]
        );
        const newProduct = { id: result.insertId, name, categoryId, price, description, imageUrl };
        res.status(201).json(newProduct);
    } catch (error) {
        handleDbError(res, error, 'Failed to create the product.');
    }
});

app.patch('/api/products/:id', authenticateToken, async (req, res) => {
    try {
        const id = parseInt(req.params.id);

        const [rows] = await db.execute('SELECT * FROM products WHERE id = ?', [id]);
        if (rows.length === 0) {
            return res.status(404).send('Product not found');
        }
        const existingProduct = rows[0];
        const updatedProduct = { ...existingProduct, ...req.body };

        const [result] = await db.execute(
            'UPDATE products SET name = ?, categoryId = ?, price = ?, description = ?, imageUrl = ? WHERE id = ?',
            [updatedProduct.name, updatedProduct.categoryId, updatedProduct.price, updatedProduct.description, updatedProduct.imageUrl, id]
        );

        if (result.affectedRows > 0) {
            res.json({ id, ...updatedProduct });
        } else {
            res.status(404).send('Product not found');
        }
    } catch (error) {
        handleDbError(res, error, 'Failed to update the product.');
    }
});

app.delete('/api/products/:id', authenticateToken, async (req, res) => {
    try {
        const [result] = await db.execute('DELETE FROM products WHERE id = ?', [req.params.id]);
        if (result.affectedRows > 0) {
            res.status(204).send();
        } else {
            res.status(404).send('Product not found');
        }
    } catch (error) {
        handleDbError(res, error, 'Failed to delete the product.');
    }
});

app.get('/api/categories', async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT * FROM categories');
        res.json(rows);
    } catch (error) {
        handleDbError(res, error, 'Failed to retrieve categories.');
    }
});

app.post('/api/products/bulk-upload', upload.single('productFile'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded.' });
    }
    res.status(202).json({ message: 'Upload received and is being processed.' });
    const filePath = req.file.path;
    const productsToInsert = [];
    fs.createReadStream(filePath)
        .pipe(csv.parse({ headers: true, ignoreEmpty: true }))
        .on('error', error => {
            console.error('Error parsing CSV:', error);
            fs.unlinkSync(filePath);
        })
        .on('data', row => {
            if (row.name && row.categoryId && row.price) {
                productsToInsert.push([
                    row.name,
                    parseInt(row.categoryId, 10),
                    parseFloat(row.price),
                    row.description || null,
                    row.imageUrl || null
                ]);
            }
        })
        .on('end', async (rowCount) => {
            console.log(`Parsed ${rowCount} rows`);
            if (productsToInsert.length > 0) {
                try {
                    const sql = 'INSERT INTO products (name, categoryId, price, description, imageUrl) VALUES ?';
                    await db.query(sql, [productsToInsert]);
                    console.log(`Successfully inserted ${productsToInsert.length} products.`);
                } catch (error) {
                    console.error('Error during bulk insert:', error);
                }
            }
            fs.unlinkSync(filePath);
        });
});

app.get('/api/products/report', async (req, res) => {
    try {
        const [products] = await db.execute(
            'SELECT p.id, p.name, c.name AS category, p.price, p.description, p.imageUrl FROM products p JOIN categories c ON p.categoryId = c.id ORDER BY p.id'
        );

        const workbook = new exceljs.Workbook();
        const worksheet = workbook.addWorksheet('Products');

        worksheet.columns = [
            { header: 'ID', key: 'id', width: 10 },
            { header: 'Name', key: 'name', width: 30 },
            { header: 'Category', key: 'category', width: 20 },
            { header: 'Price', key: 'price', width: 10, style: { numFmt: '$#,##0.00' } },
            { header: 'Description', key: 'description', width: 50 },
            { header: 'Image URL', key: 'imageUrl', width: 50 }
        ];

        worksheet.addRows(products);

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename="product-report.xlsx"');

        await workbook.xlsx.write(res);
        res.end();

    } catch (error) {
        handleDbError(res, error, 'Failed to generate the report.');
    }
});

app.listen(port, () => {
    console.log(`API server listening at http://localhost:${port}`);
});
