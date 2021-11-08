const express = require('express');
const router = express();
require("dotenv").config()
const PORT = process.env.PORT
const DOMAIN_NAME = process.env.DOMAIN_NAME
const DB_NAME = process.env.DB_NAME
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const userSchema = require('./schemas/db.schemas')
// const { MongoClient } = require('mongodb');
// const ObjectId = require('mongodb').ObjectID;
const bcrypt = require('bcrypt');
const saltRounds = 10;
const myPlaintextPassword = 's0/\/\P4$$w0rD';
const someOtherPlaintextPassword = 'not_bacon';


//------MiddleWare Functionality------//

router.use(bodyParser.urlencoded({extended:true}));
const { body, validationResult } = require('express-validator');

//------Server Routes-------//

const newServerUser = mongoose.model("serverUsers", userSchema);

const newUserCreation = (req,res) => {
    try{
        const {email, password, name, lastname, age, specialCode} = req.body;
        const salt = bcrypt.genSaltSync(saltRounds);
        const hash = bcrypt.hashSync(password, salt);
        console.log(hash)
        newServerUser.create({email, password:hash, name ,lastname,age, specialCode}, (err,doc) =>{
            if(err) console.log(err);
            res.status(400).json({ success: doc });
        });
    }catch(err){
        res.status(404).send(`${err.message}`)
    }

}

router.post('/register',
    body('email').isEmail().normalizeEmail().trim().notEmpty().custom(value => {
        return newServerUser.findOne({email: value}).then(user => {
            if (user) {
                return Promise.reject('E-mail already in use');
            }
        });
    }),
    body('password').isLength({ min: 8 }),
    body('name').isLength({ min: 3 }).trim().notEmpty(),
    body('lastname').isLength({ min: 3 }).trim().notEmpty(),
    body('age').trim().notEmpty().isInt().isFloat({min:18, max:80}),
    body('specialCode').isLength({ min: 3 }).notEmpty().trim().custom(value =>{
        if(value !== userSchema.tree.specialCode.required){
            return Promise.reject('Code invalid');
        }else{
            return value
        }
    }),

    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors });
        }
        next()
    },
    newUserCreation);

mongoose.connect(`${DOMAIN_NAME}${DB_NAME}`, function (err) {
    if(err)  return console.log(err)
    router.listen(PORT, function(){
        console.log(`Port is ${PORT}`)
        console.log(`${DOMAIN_NAME}${DB_NAME}`)
    })
});