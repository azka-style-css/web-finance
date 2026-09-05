const mysql = require('mysql2');

const db = mysql.createConnection({
    host     : 'localhost',
    user     : 'root',
    password : '',
    database : 'keuangan_kelas'
});

db.connect((err) => {
    if (err) throw err;
    console.log('Databases connected!');
});

module.exports = db;