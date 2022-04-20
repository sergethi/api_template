const path = require('path');
const fs = require('fs').promises;
const bcrypt = require('bcrypt');

const {sequelize} = require('./db');
const {User, Item} = require('./models');

const createUsers = async () => {

    const pwd1 = await bcrypt.hash('1234', 2)
    const pwd2 = await bcrypt.hash('password', 2)

    const users = [
        {name : 'Dan', password: pwd1},
        {name : 'Linda', password : pwd2}
    ];

    return users
}


const items = [
    {name : 'Gold'},
    {name : 'Silver'},
    {name : 'Paladium'}
];


const seed = async () => {

    await sequelize.sync({ force: true });

    const users = await createUsers(); // create users w/ encrypted passwords

    const userPromises = users.map(user => User.create(user))
    const itemPromises = items.map(item => Item.create(item))
    await Promise.all([...userPromises, ...itemPromises]);
    console.log("db populated!")
}

seed();