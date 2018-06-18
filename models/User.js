// name: string;
// gender: string;
// phone: string;
// sID: string;
// team: string;
// role: string;
// type: string;
// project: string;
// size: string;

const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const User = new Schema({
    name: {type: String, required: true},
    gender: {type: String, required: true},
    phone: {type: String},
    team: {type: Schema.Types.ObjectId, ref: 'team'},
    role: {type: String},
    project: {type: String},
    portpolio: {type: String},
    sId: {type: Number, unique: true},
    type: {type: String},
    size: {type: String},
    isCheck: {type: Boolean, default: false}
});

module.exports = mongoose.model('user', User);
