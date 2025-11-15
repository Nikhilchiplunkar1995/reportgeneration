const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mysql = require('mysql2/promise');

const app = express();
const port = 3001;

app.use(cors());
app.use(bodyParser.json());

// --- MySQL Connection ---
const dbConfig = {
    host: 'localhost',
    user: 'user', // Replace with your MySQL username
    password: 'password', // Replace with your MySQL password
    database: 'sustainability_db' // Replace with your database name
};

let db;

async function connectToDatabase() {
    try {
        db = await mysql.createConnection(dbConfig);
        console.log('Successfully connected to the MySQL database.');
    } catch (error) {
        console.error('Error connecting to MySQL database:', error);
        // Exit the process if the database connection fails
        process.exit(1);
    }
}

connectToDatabase();


// --- Helper Function ---
const handleDbError = (res, error, message = 'An internal server error occurred.') => {
    console.error(error);
    return res.status(500).json({ error: message });
};


// --- Products API ---

// GET all products
app.get('/api/products', async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT * FROM products');
        res.json(rows);
    } catch (error) {
        handleDbError(res, error, 'Failed to retrieve products.');
    }
});

// GET product by ID
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

// POST a new product
app.post('/api/products', async (req, res) => {
    try {
        const { name, categoryId, price, description } = req.body;
        const [result] = await db.execute(
            'INSERT INTO products (name, categoryId, price, description) VALUES (?, ?, ?, ?)',
            [name, categoryId, price, description]
        );
        const newProduct = { id: result.insertId, name, categoryId, price, description };
        res.status(201).json(newProduct);
    } catch (error) {
        handleDbError(res, error, 'Failed to create the product.');
    }
});

// PATCH an existing product
app.patch('/api/products/:id', async (req, res) => {
    try {
        const { name, categoryId, price, description } = req.body;
        const id = parseInt(req.params.id);

        // Fetch current product to merge with new data
        const [rows] = await db.execute('SELECT * FROM products WHERE id = ?', [id]);
        if (rows.length === 0) {
            return res.status(404).send('Product not found');
        }
        const existingProduct = rows[0];

        // Build the update query dynamically
        const updatedProduct = { ...existingProduct, ...req.body };

        const [result] = await db.execute(
            'UPDATE products SET name = ?, categoryId = ?, price = ?, description = ? WHERE id = ?',
            [updatedProduct.name, updatedProduct.categoryId, updatedProduct.price, updatedProduct.description, id]
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


// DELETE a product
app.delete('/api/products/:id', async (req, res) => {
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


// --- Categories API ---

// GET all categories
app.get('/api/categories', async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT * FROM categories');
        res.json(rows);
    } catch (error) {
        handleDbError(res, error, 'Failed to retrieve categories.');
    }
});

// GET category by ID
app.get('/api/categories/:id', async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT * FROM categories WHERE id = ?', [req.params.id]);
        if (rows.length > 0) {
            res.json(rows[0]);
        } else {
            res.status(404).send('Category not found');
        }
    } catch (error) {
        handleDbError(res, error, 'Failed to retrieve the category.');
    }
});

// POST a new category
app.post('/api/categories', async (req, res) => {
    try {
        const { name } = req.body;
        const [result] = await db.execute('INSERT INTO categories (name) VALUES (?)', [name]);
        const newCategory = { id: result.insertId, name };
        res.status(201).json(newCategory);
    } catch (error) {
        handleDbError(res, error, 'Failed to create the category.');
    }
});

// PATCH an existing category
app.patch('/api/categories/:id', async (req, res) => {
    try {
        const { name } = req.body;
        const [result] = await db.execute('UPDATE categories SET name = ? WHERE id = ?', [name, req.params.id]);
        if (result.affectedRows > 0) {
            res.json({ id: parseInt(req.params.id), name });
        } else {
            res.status(404).send('Category not found');
        }
    } catch (error) {
        handleDbError(res, error, 'Failed to update the category.');
    }
});

// DELETE a category
app.delete('/api/categories/:id', async (req, res) => {
    try {
        // Optional: Check for products using this category before deleting
        const [products] = await db.execute('SELECT id FROM products WHERE categoryId = ?', [req.params.id]);
        if (products.length > 0) {
            return res.status(400).json({ error: 'Cannot delete category that is currently in use by products.' });
        }
        
        const [result] = await db.execute('DELETE FROM categories WHERE id = ?', [req.params.id]);
        if (result.affectedRows > 0) {
            res.status(204).send();
        } else {
            res.status(404).send('Category not found');
        }
    } catch (error) {
        handleDbError(res, error, 'Failed to delete the category.');
    }
});


// --- Server Listener ---
app.listen(port, () => {
    console.log(`API server listening at http://localhost:${port}`);
});
