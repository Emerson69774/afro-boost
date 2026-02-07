// app.js
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const path = require('path');

const app = express();

// --- Middleware ---
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Sert le dossier public (HTML, CSS, JS)
app.use(express.static(path.join(__dirname, 'public')));

// --- Base SQLite ---
const db = new sqlite3.Database('./afroboost.db', (err) => {
  if(err) console.error(err.message);
  else console.log('Base de données connectée.');
});

// Créer tables si elles n'existent pas
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

  db.run(`CREATE TABLE IF NOT EXISTS packs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    network TEXT,
    type TEXT,
    quantity INTEGER,
    price INTEGER
  )`);
});

// --- Routes API ---

// Inscription client/freelance
app.post('/signup', (req,res)=>{
  const {name,email,phone,role} = req.body;
  const can_withdraw = role==='freelance'?1:0;
  const sql = `INSERT INTO users (name,email,phone,role,can_withdraw) VALUES (?,?,?,?,?)`;
  db.run(sql,[name,email,phone,role,can_withdraw], function(err){
    if(err) return res.status(400).json({error: err.message});
    res.json({id:this.lastID,message:'Utilisateur créé !'});
  });
});

// Ajouter packs (admin ou initial)
app.post('/addpack', (req,res)=>{
  const {network,type,quantity,price} = req.body;
  const sql = `INSERT INTO packs (network,type,quantity,price) VALUES (?,?,?,?)`;
  db.run(sql,[network,type,quantity,price],function(err){
    if(err) return res.status(400).json({error:err.message});
    res.json({id:this.lastID,message:'Pack ajouté !'});
  });
});

// Lister packs
app.get('/packs/:network', (req,res)=>{
  const {network} = req.params;
  db.all(`SELECT * FROM packs WHERE network=?`, [network], (err,rows)=>{
    if(err) return res.status(400).json({error:err.message});
    res.json(rows);
  });
});

// Passer une commande (client)
app.post('/order', (req,res)=>{
  const {user_id,pack_id} = req.body;
  db.get(`SELECT * FROM packs WHERE id=?`, [pack_id], (err,row)=>{
    if(err || !row) return res.status(400).json({error:'Pack introuvable'});
    const sql = `INSERT INTO orders (user_id,network,action,quantity,status) VALUES (?,?,?,?,?)`;
    db.run(sql,[user_id,row.network,row.type,row.quantity,'pending'],function(err){
      if(err) return res.status(400).json({error:err.message});
      db.run(`UPDATE users SET balance=balance-? WHERE id=?`, [row.price,user_id]);
      res.json({id:this.lastID,message:'Commande créée !'});
    });
  });
});

// Wallet utilisateur
app.get('/wallet/:user_id',(req,res)=>{
  const {user_id} = req.params;
  db.get(`SELECT balance,can_withdraw FROM users WHERE id=?`, [user_id], (err,row)=>{
    if(err || !row) return res.status(400).json({error:'Utilisateur introuvable'});
    res.json(row);
  });
});

// Retrait freelance
app.post('/withdraw', (req,res)=>{
  const {user_id,amount} = req.body;
  db.get(`SELECT balance,can_withdraw FROM users WHERE id=?`, [user_id], (err,row)=>{
    if(err || !row) return res.status(400).json({error:'Utilisateur introuvable'});
    if(row.can_withdraw!==1) return res.status(400).json({error:'Pas autorisé à retirer'});
    if(row.balance<amount) return res.status(400).json({error:'Solde insuffisant'});
    db.run(`UPDATE users SET balance=balance-? WHERE id=?`, [amount,user_id], function(err2){
      if(err2) return res.status(400).json({error:err2.message});
      res.json({message:`Retrait de ${amount} réussi !`});
    });
  });
});

// Lister commandes
app.get('/orders',(req,res)=>{
  db.all(`SELECT * FROM orders`, [], (err,rows)=>{
    if(err) return res.status(400).json({error:err.message});
    res.json(rows);
  });
});

// --- Lancer serveur ---
const PORT = process.env.PORT || 3000;
app.listen(PORT,()=>console.log("Afro Boost lancé sur le port "+PORT));
