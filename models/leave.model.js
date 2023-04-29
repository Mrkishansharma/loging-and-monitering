
const mongoose = require('mongoose');
const { EmpModel } = require('./user.model');

const leaveSchema = mongoose.Schema({
    EMPID: { type : mongoose.Schema.Types.ObjectId, ref : EmpModel, required : true },
    Status: { type : String, enum: ["Pending", "Approved", "Cancel"], default : "Pending", required : true }
})

const LeaveModel = mongoose.model("leave", leaveSchema);

module.exports = {
    LeaveModel
}