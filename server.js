const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.post('/login', (req, res) => {
    console.log('Login request received:', req.body);
    res.json({
        code: 0,
        status: 0,
        msg: "success",
        token: "mock-token-12345",
        uid: "123456"
    });
});

app.get('/', (req, res) => {
    res.send('Server is active');
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
