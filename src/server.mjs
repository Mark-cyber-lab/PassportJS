import express from 'express';
import passport from 'passport';
import { Strategy as BearerStrategy } from 'passport-http-bearer';
import jwt from 'jsonwebtoken';
import user from './users.mjs';
import bodyParser from 'body-parser';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { decode } from 'punycode';

const __dirname = dirname(fileURLToPath(import.meta.url));

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));

//initialize the bodyparser
app.use(bodyParser.json());

//initialize the passport middleware
app.use(passport.initialize());
// Use __dirname in your Express routes or middleware
app.use(express.static(__dirname + '/public'));

// Passport setup


// Function to generate JWT token
function generateToken(user) {
    const payload = { id: user.id, username: user.username, email: user.email };
    const token = jwt.sign(payload, 'your_secret_key', { expiresIn: '1h' });

    return token;
}

// Function to find user by token
function getUserFromToken(token) {
    try {
        //convert the token to its original form
        const decodedToken = jwt.verify(token, 'your_secret_key');

        return user.find(u => u.username === decodedToken.username && u.id === decodedToken.id && u.email === decodedToken.email);
    } catch (error) {
        return null;
    }
}

// Bearer strategy setup
passport.use(new BearerStrategy(
    (token, done) =>  {
        try {
            console.log("1")
            // Verify the token
            console.log(token);
            const User = getUserFromToken(token);
            console.log(User)
            if (!User) {
                return done(null, false);
            }
            return done(null, User);
        } catch (error) {
            return done(error);
        }
    }
));
 
app.get('/profile', passport.authenticate('bearer', { session: false }), (req, res) => {
  // This route is only accessible with a valid token
 console.log('Welcome to the protected route!');
});

app.get('/loginAttempt', (req, res) => {
    res.sendFile(__dirname + "/" + 'sample.html');
})

// Login route (generates and returns token)
app.post('/login', (req, res) => {
    const {
        username,
        password
    } = req.body;

    //const { username, password } = await JSON.parse(req.body);
    console.log(username + "\n" + password);

    // Authenticate user (replace this with your actual authentication logic)
    const User = user.find(user => user.username === username && user.password === password);

    if (!User) {
        return res.status(401).json({ message: 'Authentication failed' });
    }

    // Generate token
    const token = 'Bearer ' + generateToken(User);

    console.log("token successfully created!");
    res.json({token});

});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
