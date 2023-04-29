
const express = require('express');

const jwt = require('jsonwebtoken')

const cookieParser = require('cookie-parser')

const { connection } = require('./db');

const { EmpModel } = require('./models/user.model');

const { LeaveModel } = require('./models/leave.model');


const expresswinston = require('express-winston');
const winston = require('winston');
const { createLogger, transports } = require('winston');



const app = express();

app.use(express.json());

app.use(cookieParser());





const errorLogger = winston.createLogger({
    level: 'error',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(),
        winston.format.prettyPrint()
    ),
    transports: [
        new winston.transports.File({ filename: 'logs/error.log' }),
        new winston.transports.Console()
    ]
});



const infoLogger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(),
        winston.format.prettyPrint()
    ),
    transports: [
        new winston.transports.File({ filename: 'logs/info.log' }),
        new winston.transports.Console()
    ]
});





function ErrorLoger(err){

    errorLogger.error({
        message: 'Error occurred',
        error: {
            message: err.message,
            stack: err.stack
        }
    });

}


app.use((err,req,res,next)=>{

    if (err) {
        ErrorLoger(err);
    }

    next()

})


app.use((req, res, next) => {

    infoLogger.info({
        message: 'Incomming Request',
        method: req.method,
        url: req.url,
        headers: req.headers,
        query: req.query,
        body: req.body
    });
    
    next();
})






app.post('/register', async (req, res) => {
    try {
        const newEmp = new EmpModel(req.body);
        await newEmp.save();
        return res.send(newEmp)
    } catch (error) {
        ErrorLoger(error);
        return res.status(500).send({ "error": error.message });
    }
})



app.post('/login', async (req, res) => {
    const { Email, Pass } = req.body;
    try {
        const user = await EmpModel.findOne({ Email });
        if (user?.Pass === Pass) {
            const token = jwt.sign({ EMPID: user._id }, "DHONI", { expiresIn: "5m" });
            res.cookie("TOKEN", token, { maxAge: 1000 * 60 * 5 });
            return res.status(200).send("Login Successfull");
        } else {
            return res.status(400).send('Invalid Password');
        }
    } catch (error) {
        ErrorLoger(error);
        return res.status(500).send(error.message);
    }
})




app.post('/take-leave', auth, async (req, res) => {
    const { EMPID } = req.payload;
    try {
        const newLeave = new LeaveModel({ EMPID });
        await newLeave.save();
        return res.status(200).send("Leave Request is send. (Status :- Pending....)")
    } catch (error) {
        ErrorLoger(error);
        return res.status(500).send({ msg: error.message })
    }
})


app.get('/leaves', auth, async (req, res) => {
    const { EMPID } = req.payload;
    try {
        const leaves = await LeaveModel.find({ EMPID })
        res.json(leaves)
    } catch (error) {
        ErrorLoger(error);
        return res.status(500).send({ msg: error.message })
    }
})


app.delete('/cancel-leave/:ID', auth, async (req, res) => {
    const { ID } = req.params;
    let { EMPID } = req.payload;
    // EMPID = new mongoose.Types.ObjectId(EMPID)
    try {
        const leavePresent = await LeaveModel.findById({ _id: ID });
        console.log(leavePresent);
        console.log(EMPID == leavePresent?.EMPID);
        console.log(EMPID);
        if (leavePresent && leavePresent.EMPID == EMPID) {
            await LeaveModel.findByIdAndDelete({ _id: ID })
            return res.status(200).send("leave canceled successfully")
        } else {
            return res.status(400).send("Something went rong")
        }
    } catch (error) {
        ErrorLoger(error);
        return res.status(500).send({ msg: error.message })
    }
})



app.patch('/handle-leave/:ID', auth, verifyRole(["Admin"]), async (req, res) => {
    const { ID } = req.params;
    const { Status } = req.body;
    try {
        const leave = await LeaveModel.findById({ _id: ID });
        if (leave?.Status === "Pending") {
            await LeaveModel.findByIdAndUpdate({ _id: ID }, { Status })
            return res.status(200).send("Leave updated")
        } else {
            return res.status(400).send("You can't able to update leave while leave is canceled or approved");
        }
    } catch (error) {
        ErrorLoger(error);
        return res.status(500).send({ msg: error.message })
    }
})




app.listen(3000, async () => {
    try {
        await connection
        console.log('connected');
    } catch (error) {
        ErrorLoger(error);
        console.log(error);
    }
    console.log('server is runinng');
})




// Middleware for verify login user
function auth(req, res, next) {
    const { TOKEN } = req.cookies;
    if (TOKEN) {
        try {
            const decoded = jwt.verify(TOKEN, "DHONI");
            if (decoded) {
                // console.log(decoded);
                req.payload = decoded;
                // console.log(req.payload);
                next();
            } else {
                return res.status(400).send("Something went wrong")
            }
        } catch (error) {
            ErrorLoger(error);
            return res.status(400).send({ err: error.message })
        }
    } else {
        return res.status(400).send("Token Not Found")
    }
}


function verifyRole(permiteRoles) {
    return async (req, res, next) => {
        const { EMPID } = req.payload;
        try {
            const emp = await EmpModel.findById({ _id: EMPID });
            if (permiteRoles.includes(emp.Role)) {
                next();
            } else {
                return res.status(401).send("Unauthorized Access");
            }
        } catch (error) {
            ErrorLoger(error);
            return res.status(500).send({"error":error.message})
        }
    }
}
