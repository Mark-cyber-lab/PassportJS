import express from 'express';
import passport from 'passport';
import { Strategy as BearerStrategy } from 'passport-http-bearer';
import jwt from 'jsonwebtoken';
import user from './users.mjs';
import bodyParser from 'body-parser';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));

// Use __dirname in your Express routes or middleware
app.use(express.static(__dirname + '/public'));

// Function to generate JWT token
function generateToken(user) {
    const payload = { id: user.id, username: user.username, email: user.email };
    const token = jwt.sign(payload, 'your_secret_key', { expiresIn: '1h' });

    return token;
}

// Function to find user by token
function getUserFromToken(token) {
    try {
        const decoded = jwt.verify(token, 'your_secret_key');
        console.log(decoded)
        return user.find(u => u.username === decoded.username && u.id === decoded.id && u.email === decoded.email);
    } catch (error) {
        return null;
    }
}

// Passport setup
app.use(passport.initialize());

// Bearer strategy setup
passport.use(new BearerStrategy(
    (token, done) =>  {
        try {
            console.log("1")
            // Verify the token
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
  res.send('Welcome to the protected route!');
});

app.get('/loginAttempt', (req, res) => {
    res.sendFile(__dirname + "/" + 'sample.html');
})

// Login route (generates and returns token)
app.post('/login', (req, res) => {
    const { username, password } = req.body;

    // Authenticate user (replace this with your actual authentication logic)
    const User = user.find(user => user.username === username && user.password === password);

    if (!User) {
        return res.status(401).json({ message: 'Authentication failed' });
    }
    // Generate token
    const token = generateToken(User);
    res.headers['Authorization'] = 'Bearer ' + token;
    console.log(req.headers['Authorization'])
    console.log(jwt.verify(token, 'your_secret_key'))
    res.send("token successfully created");

});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
