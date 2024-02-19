var con = require("./connection");
var con = require("./connection");
var express = require('express');
var app = express();
const cors = require('cors');
var bodyParser = require('body-parser');

// Enable CORS for all routes
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/register.html');
});

app.post('/signup', (req, res) => {
    var name = req.body.name;
    var email = req.body.email;
    var lastName = req.body.lastName;
    var password = req.body.password;
    console.log(req.body);

    var sql = "INSERT INTO user_details(uname, ulastName, uemail, upasword) VALUES (?, ?, ?, ?)";
    con.query(sql, [name, lastName, email, password], (error, result) => {
        if (error) {
            console.log(error)
            return res.status(500).json({ success: false, message: 'Registration failed' });
        }

        res.send('Inserted');
    });
});

app.post('/signin', (req, res) => {

    var email = req.body.email;
    var password = req.body.password;
    var userId = req.body.userId;
    console.log(req.body);

    // res.status(500).json({ success: false, message: 'Login failed' })

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    // Check credentials against the database
    var sql = 'SELECT uid FROM user_details WHERE uemail = ? AND upasword = ?';
    con.query(sql, [email, password], (err, results) => {
        if (err) {
            console.error('MySQL query error:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }

        if (results.length === 1) {
            const userId = results[0].uid;
            res.json({ userId });

            //res.json({ message: 'Login successful' });
        } else {

            res.status(401).json({ error: 'Invalid email or password' });
        }
    });
});

app.post('/location', (req, res) => {
    var latitude = req.body.latitude;
    var longitude = req.body.longitude;
    var user = req.body.user;
    console.log(req.body);

    var sql = "INSERT INTO coordinates(latitude, longitude,uid) VALUES (?, ?,?)";
    con.query(sql, [latitude, longitude,user], (error, result) => {
        if (error) {
            console.log(error)
            return res.status(500).json({ success: false, message: 'Insertion failed' });
        }

        res.send('Inserted');
    });
});

app.get('/user_details', (req, res) => {
    var sql = "SELECT * FROM user_details";
    con.query(sql, (error, result) => {
        if (error) {
            console.log(error);
            return res.status(500).json({ success: false, message: 'Failed to fetch user details' });
        }
        res.render(__dirname + "/user_details", { user_details: result });
    });
});

app.get('/delete-user_details', (req, res) => {
    var sql = "DELETE FROM user_details WHERE uid=?";
    var id = req.query.uid;
    con.query(sql, [id], (error, result) => {
        if (error) {
            console.log(error);
            return res.status(500).json({ success: false, message: 'Failed to delete user details' });
        }
        res.redirect('/user_details');
    });
});

app.get('/update-user_details', (req, res) => {
    var sql = "SELECT * FROM user_details WHERE uid=?";
    var id = req.query.uid;
    con.query(sql, [id], (error, result) => {
        if (error) {
            console.log(error);
            return res.status(500).json({ success: false, message: 'Failed to fetch user details for update' });
        }
        res.render(__dirname + "/update_user", { user_details: result });
    });
});

app.post('/update-user_details', (req, res) => {
    var name = req.body.name;
    var email = req.body.email;
    var id = req.body.id;

    var sql = "UPDATE user_details SET uname=?, uemail=? WHERE uid=?";
    con.query(sql, [name, email, id], (error, result) => {
        if (error) {
            console.log(error);
            return res.status(500).json({ success: false, message: 'Failed to update user details' });
        }
        res.redirect('/user_details');
    });
});

app.listen(4000, () => {
    console.log('Server is running on port 4000');
});
