const express = require('express');
const app = express();
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const session = require('express-session');
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
const nodeZip = require('node-zip');
const fs = require('fs');
const User = require("./models/User");
const Team = require("./models/Team");

const log = require('simple-node-logger').createSimpleLogger({
    logFilePath: 'info.log',
    timestampFormat: 'YYYY-MM-DD HH:mm:ss.SSS'
});

mongoose.connect('mongodb://localhost/sunrinton3');

const helmet = require('helmet');
app.use(helmet());
app.set("port", process.env.PORT || 3000);
app.set("pass", process.env.PASS || "TEST*2")
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
    secret: '@#@$MYSIGN#@$#$',
    resave: false,
    saveUninitialized: true
}));

app.use("/PortPolio", express.static("PortPolio/"));

if (process.env.NODE_ENV === "production") {
    app.use(express.static("sunrinton-client/build"));
}

app.get('/api/test', (req, res) => {
    var ip;
    if (req.headers['x-forwarded-for']) {
        ip = req.headers['x-forwarded-for'].split(",")[0];
    } else if (req.connection && req.connection.remoteAddress) {
        ip = req.connection.remoteAddress;
    } else {
        ip = req.ip;
    }
    console.log("connected client IP is *********************" + ip);
    res.send("Server Connected")
})

app.get('/api/user/:id', (req, res) => {
    User.findOne({ sId: req.params.id }).populate('team').then(user => {
        if (user) res.status(200).json({ name: user.name, team: user.team.name })
        else res.status(201).json({ message: 'not found' })
    })
})

app.get('/api/team/:name', (req, res) => {
    Team.findOne({name: req.params.name}).populate('users').then(team => {
        const zip = new nodeZip();
        const pp = team.users.map((user) => {
            zip.file(user.portpolio.replace("PortPolio", `${req.params.name}`), fs.readFileSync(user.portpolio));
        })
        var data = zip.generate({base64:false, compression:'DEFLATE'}); 
        fs.writeFileSync(`PortPolio/${req.params.name}.zip`, data, 'binary'); 
        res.send(`PortPolio/${req.params.name}.zip`);
    })
})

app.post('/api/isAdmin', (req, res) => {
    res.status(200).send(req.session.admin);
})

app.get('/api/pass/:name', (req, res) => {
    Team.findOne({name: {$regex: new RegExp( '^' + req.params.name.replace(/\s/gi, ""), 'i')}}).then(team => {
        if(team) {
            if(team.isPass) res.status(200).send({team: team.name, isPass:true});
            else res.status(200).send({team: team.name, isPass: false});
        } else {
            res.status(200).send({team: "none", isPass: false});
        }
    })
});

app.post('/api/users', (req, res) => {
    var ip;
    if (req.headers['x-forwarded-for']) {
        ip = req.headers['x-forwarded-for'].split(",")[0];
    } else if (req.connection && req.connection.remoteAddress) {
        ip = req.connection.remoteAddress;
    } else {
        ip = req.ip;
    }
    console.log("ADMIN :::: " + ip + "      " + req.body.passwd + "     " + req.session.admin);

    if (req.body.passwd === app.get("pass") || req.session.admin) {
        User.find().populate('team').then(users => {
            let ret = users.filter((user) => {
                return user.team.isPass
            })
            res.status(200).send(ret);
        });
        req.session.admin = true;
    } else {
        res.status(204).send({ message: "you are not admin!!" });
    }
})

app.post('/api/check/:name', (req, res) => {
    User.findOne({name: req.params.name}).then(user => {
        user.isCheck = true;
        return user.save();
    }).then(user => {
        if(!user) throw new Error("Err!");
        else res.status(200).json({message: "okay"});
    }).catch(e => {
        res.status(500).json({message: e.message});
    })
})

app.post('/api/teams', (req, res) => {
    var ip;
    if (req.headers['x-forwarded-for']) {
        ip = req.headers['x-forwarded-for'].split(",")[0];
    } else if (req.connection && req.connection.remoteAddress) {
        ip = req.connection.remoteAddress;
    } else {
        ip = req.ip;
    }
    console.log("ADMIN :::: " + ip + "      " + req.body.passwd + "     " + req.session.admin);

    if (req.body.passwd === app.get("pass") || req.session.admin) {
        Team.find().populate('users').then(teams => {
            res.status(200).json(teams);
        })
        req.session.admin = true;
    } else {
        res.status(204).send({ message: "you are not admin!!" });
    }
})


app.post('/api/apply', upload.single('portpolio'), (req, res) => {
    var ip;
    if (req.headers['x-forwarded-for']) {
        ip = req.headers['x-forwarded-for'].split(",")[0];
    } else if (req.connection && req.connection.remoteAddress) {
        ip = req.connection.remoteAddress;
    } else {
        ip = req.ip;
    }
    Team.findOne({ name: req.body.team.replace(/\s/gi, "") }).then(team => {
        if (team) {
            return team;
        } else {
            const team = new Team({
                name: req.body.team.replace(/\s/gi, "")
            });
            return team.save();
        }
    }).then(team => {
        if (!team) throw Error("DB Nout Fond - User")
        const user = new User({
            name: req.body.name,
            gender: req.body.gender,
            phone: req.body.phone,
            team: team._id,
            role: req.body.role,
            project: req.body.project,
            portpolio: typeof req.file !== "undefined" ? req.file.path : "null",
            sId: req.body.sID,
            size: req.body.size,
            type: req.body.type
        });
        team.users.push(user._id)
        team.save();
        return user.save();
    }).then(user => {
        if (!user) throw Error("DB Nout Fond - User")
        console.log(`${Date.now()}::save success - ${user.name}`)
        log.info(`[${ip}]${user.name} - save success`)
        res.status(200).send({ "message": "success" });
    }).catch(e => {
        if (e.code === 11000) {
            res.status(202).send({ "message": "Server Err Occur!!" });
        } else {
            console.log(e);
            res.status(400).send({ "message": "Server Err Occur!!" });
        }
    })
})

app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '.', 'sunrinton-client', 'build', 'index.html'));
});

app.listen(app.get("port"), () => {
    console.log(`Find the server at: http://localhost:${app.get("port")}/       ${app.get("pass")}`); // eslint-disable-line no-console
});
