const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.post('/login', (req, res) => {
    console.log('May nag-try mag-login:', req.body);
    res.json({
        status: 0,
        message: "Login Success!",
        token: "fake-session-token-12345"
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
