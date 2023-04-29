
const mongoose = require('mongoose');

const empSchema = mongoose.Schema({
    Name : {type:String, required:true},
    Email : {type:String, required:true, unique:true},
    Pass : {type:String, required:true},
    Role : {type:String, enum:["Employee", "Admin"], default:"Employee"}
})

const EmpModel = mongoose.model("emp", empSchema);

module.exports = {
    EmpModel
}