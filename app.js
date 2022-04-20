const express = require("express");
//require basicAuth
const basicAuth = require('express-basic-auth');
//require bcrypt
const bcrypt = require('bcrypt');
// set salt
const saltRounds = 2;

const {User, Item} = require('./models');
const { use } = require("bcrypt/promises");

// initialise Express
const app = express();

// specify out request bodies are json
app.use(express.json());

// routes go here
app.get('/', (req, res) => {
  res.send('<h1>App Running</h1>')
})

//create users
app.post('/users', async(req, res) => {
  //hash the plaintext password from the request body
  bcrypt.hash(req.body.password, 2, async function(err, encrypted){
    //create new user, storing the hashed password
    try {
      let newUser = await User.create({'name': req.body.name, 'password': encrypted})
      res.send('user created')
    } catch (err) {
      res.send(err)
    }
    
  })
  
})
// example of bcrypt compare - not the best practices
// need to be a post because we are sending info in a req.body
app.post('/session', async(req, res) => {
  //find a user in the db by matching the name in the req.body
  const thisUser = await User.findOne({
    where: {name: req.body.name}
  })
  //if found ,compare user password to a hash from db
  if(!thisUser){
    res.send('user not found')
  }
  else{
    bcrypt.compare(req.body.password, thisUser.password, async function(err, name){
      if(name){
        res.send(`Logged as', ${thisUser.name}`)
      }
      else{
        res.send('password do not match')
      }
    }) 
  }
})

//get users
app.get('/users', async(req, res) => {
  let users = await User.findAll()
  res.json(users)
})

//get user by id
app.get('/users/:id', async(req, res) => {
  let user = await User.findByPk(req.params.id)
  res.json(user)
})

//update users
// app.put('/users/:id', async(req, res) => {
//   let id = req.params.id
//   let newUser = await User.create(req.body)
//   res.json(newUser)
// })

app.listen(3000, () => {
  console.log("Server running on port 3000");
});