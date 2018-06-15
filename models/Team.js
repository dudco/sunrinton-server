const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const Team = new Schema({
    name: {type: String, required: true},
    users: {type: [Schema.Types.ObjectId], ref: 'user'}
});


Team.statics.findOneByTeamName = function(name) {
    return this.findOne({
        name,
    }).exec();
};

module.exports = mongoose.model('team', Team);