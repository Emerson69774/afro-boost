const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const app = express();
const bodyParser = require('body-parser');

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Base de données SQLite
const db = new sqlite3.Database('./afroboost.db', (err) => {
  if (err) console.error(err.message);
  else console.log('Base de données connectée.');
});

// Créer les tables si elles n'existent pas
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    email TEXT UNIQUE,
    phone TEXT,
    role TEXT,
    balance INTEGER DEFAULT 0,
    can_withdraw INTEGER DEFAULT 0
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    network TEXT,
    action TEXT,
    quantity INTEGER,
    status TEXT DEFAULT 'pending',
    FOREIGN KEY(user_id) REFERENCES users(id)
  )`);
});

// Route test
app.get('/', (req, res) => {
  res.send('Afro Boost est en ligne !');
});

// Inscription client/freelance
app.post('/signup', (req, res) => {
  const { name, email, phone, role } = req.body;
  const can_withdraw = role === 'freelance' ? 1 : 0;
  const sql = `INSERT INTO users (name,email,phone,role,can_withdraw) VALUES (?,?,?,?,?)`;
  db.run(sql, [name,email,phone,role,can_withdraw], function(err){
    if(err) return res.status(400).json({error: err.message});
    res.json({id: this.lastID, message: 'Utilisateur créé !'});
  });
});

// Passer une commande
app.post('/order', (req,res) => {
  const { user_id, network, action, quantity } = req.body;
  const sql = `INSERT INTO orders (user_id, network, action, quantity) VALUES (?,?,?,?)`;
  db.run(sql, [user_id, network, action, quantity], function(err){
    if(err) return res.status(400).json({error: err.message});
    res.json({id: this.lastID, message: 'Commande créée !'});
  });
});

// Lister commandes (test)
app.get('/orders', (req,res) => {
  db.all('SELECT * FROM orders', [], (err, rows) => {
    if(err) return res.status(400).json({error: err.message});
    res.json(rows);
  });
});

// Lancer le serveur
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Afro Boost lancé sur le port " + PORT);
});
