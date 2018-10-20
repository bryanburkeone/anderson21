const nodemailer = require('nodemailer');

const transport = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: process.env.MAIL_Port,
    auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
    },
});

const makeANiceEmail = text =>`
    <div 
        className="email" 
        style="
            border: 1px soild black;
            padding: 20px;
            font-family: sans-serif;
            font-size: 20px;
        "
    >
    <h2>Hello There!</h2>
    <p>${text}</p>
    <p>bryan</p>
</div>
`;

exports.transport = transport;
exports.makeANiceEmail = makeANiceEmail;