const express = require('express');
const app = express();
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const multer = require('multer');
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'PortPolio/');
    },
    filename: function (req, file, cb) {
        console.log(req.body);
        cb(null, `${req.body.name}(${req.body.team})-${file.originalname}`);
    },
});
const upload = multer({ storage: storage });
const path = require('path');
const User = require("./models/User");
const Team = require("./models/Team");

const log = require('simple-node-logger').createSimpleLogger({
    logFilePath:'info.log',
    timestampFormat:'YYYY-MM-DD HH:mm:ss.SSS'
});

mongoose.connect('mongodb://localhost/sunrinton');

const helmet = require('helmet');
app.use(helmet());

app.set("port", process.env.PORT || 3000);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

if (process.env.NODE_ENV === "production") {
    app.use(express.static("sunrinton-client/build"));
}

app.get('/api/test', (req, res) => {
    console.log("asdfasdfasdfa!!");
    res.send("Server Connected")
})

app.post('/api/apply', upload.single('portpolio'), (req, res) => {
    Team.findOne({ name: req.body.team }).then(team => {
        if (team) {
            return team;
        } else {
            const team = new Team({
                name: req.body.team
            });
            return team.save();
        }
    }).then(team => {
        if(!team) throw Error("DB Nout Fond - User")
        const user = new User({
            name: req.body.name,
            gender: req.body.gender,
            phone: req.body.phone,
            team: team._id,
            role: req.body.role,
            project: req.body.project,
            portpolio: typeof req.file !== "undefined" ? req.file.path : "null",
        });
        team.users.push(user._id)
        team.save();
        return user.save();
    }).then(user => {
        if(!user) throw Error("DB Nout Fond - User")
        console.log(`${Date.now()}::save success - ${user.name}`)
        log.info(`${user.name} - save success`)
        res.status(200).send({"message": "success"});
    }).catch(e => {
        if(e) {
            console.log(e.message);
            res.status(400).send({ "message": "Server Err Occur!!" });
        }
    })
})

app.get('*', (req, res) => {
  res.sendFile(path.resolve(__dirname, '.', 'sunrinton-client', 'build', 'index.html'));
});

app.listen(app.get("port"), () => {
    console.log(`Find the server at: http://localhost:${app.get("port")}/`); // eslint-disable-line no-console
});
