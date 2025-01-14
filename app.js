const express = require("express");
//require basicAuth
const basicAuth = require('express-basic-auth');
//require bcrypt
const bcrypt = require('bcrypt');
// set salt
const saltRounds = 2;
//jwt
var { expressjwt: jwt } = require('express-jwt');
var jwks = require('jwks-rsa');
require('dotenv').config('.env');
//request a token
var request = require("request");


const {User, Item} = require('./models');
const { use } = require("bcrypt/promises");


// initialise Express
const app = express();

// specify out request bodies are json
app.use(express.json());



//jwt config
var jwtCheck = jwt({
  secret: jwks.expressJwtSecret({
      cache: true,
      rateLimit: true,
      jwksRequestsPerMinute: 5,
      jwksUri: `https://${process.env.AUTH0_DOMAIN}/.well-known/jwks.json`
}),
audience: 'localhost:8080',
issuer: `https://${process.env.AUTH0_DOMAIN}/`,
algorithms: ['RS256']
});

// require jwt for all endpoints
//app.use(jwtCheck);




// routes go here

//Home route
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
        //res.send(`Logged as, ${thisUser.name}`)
        let user = thisUser.name
        res.status(200).send({"loginAs":user})
      }
      else{
        res.send('password do not match')
      }
    }) 
  }
})

//get users
app.get('/users', jwtCheck, async(req, res) => {
  let users = await User.findAll()
  res.json(users)
})

//get user by id
app.get('/users/:id', jwtCheck, async(req, res) => {
  let user = await User.findByPk(req.params.id)
  res.json(user)
})

//update users
// app.put('/users/:id', async(req, res) => {
//   let id = req.params.id
//   let newUser = await User.create(req.body)
//   res.json(newUser)
// })

//configure basicAuth
app.use(basicAuth({
  authorizer: dbAuthorizer,
  authorizeAsync: true,
  unauthorizedResponse: () => "you do not have access to this endpoint"
}))

// compare username and password with db users
// return a boolean indicating a username and a pasword math
async function dbAuthorizer(username, password,callback){
  try{
    //get matching user from db
    const user = await User.findOne({where:{name: username}})
    //if username is valid, match password
    let isValid =  (user != null) ? await bcrypt.compare(password, user.password) : false;
    console.log("username and password math?", true)
    callback(null, isValid)
  }
  catch(err){
    // if authorize fails, log error
    console.log("erroe: ", err)
    callback(null, false)
  }
}

//login route secure with basic auth and return a token
app.get('/login', async(req, res) => {
    var options = { method: 'POST',
    url: `https://${process.env.AUTH0_DOMAIN}/oauth/token`,
    headers: { 'content-type': 'application/json' },
    body: `{"client_id":"${process.env.CLIENT_ID}","client_secret":"${process.env.CLIENT_SECRET}","audience":"localhost:8080","grant_type":"client_credentials"}` };

  request(options, function (error, response, body) {
    if (error) throw new Error(error);
    
    const toJson = JSON.parse(body)
    const token = toJson.access_token
    res.json(token)
    console.log(token);
  })
})


app.listen(8080, () => {
  console.log("Server running on port 8080");
});