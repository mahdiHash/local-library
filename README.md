# Local Library

This is a local site to record information about books in your database.

I learned Express.js from [MDN Express/Node.js tutorial](https://developer.mozilla.org/en-US/docs/Learn/Server-side/Express_Nodejs/Introduction) (The Odin Project recommended) by completing a mini project: [Local Library](https://developer.mozilla.org/en-US/docs/Learn/Server-side/Express_Nodejs/Tutorial_local_library_website).

In this project/tutorial, I learned:
- how to create an application using Express application generator,
- how to create route handlers for a website,
- how to do CRUD operations on a database,
- how to work with view templates to render data for the user,
- and how to work with forms (validation and sanitization on the server-side).

The technologies I used:
- JavaScript on the server-side,
- Node.js runtime environment,
- Express.js framework,
- MongoDB database and Mongoose library,
- and Pug view engine.

My project is a little different from the [original one](https://github.com/mdn/express-locallibrary-tutorial), but the main structure is the same. Mostly, the difference is about how the data will be shown to user after retrieving it from the database and some code refactoring (e.g. using `Promise` instead of "async" module).

I don't know how to authenticate users yet, so this project doesn't include authentication. This means anyone can change the content of the site. I'll work on it whenever I'm ready.

## How to run

To run this site and see if it works well, you need to have some things to be installed and ready. 

First, you need to download and install [Node.js](https://nodejs.org/en/).

Second, you need to have a MongoDB database so the app can connect to it. You can get a free tier of [MongoDB Atlas](https://www.mongodb.com/atlas/database). There's a guide [here](https://developer.mozilla.org/en-US/docs/Learn/Server-side/Express_Nodejs/mongoose#setting_up_the_mongodb_database). 

Third, you need to clone this repo. Go to any directory you want in your computer. Then, open the terminal and write the command below (I assume you already have Git installed):

```
git clone https://github.com/mahdiHash/local-library.git
```  

After that:  

```
cd local-library
```

Now you need to go to `app.js` in the root directory and replace the string below with your database URI:  

``` js
var mongoDB = 'YOUR DATABASE URI GOES HERE';
``` 

To see some items in the site, you need to populate your database with some samples. This short [guide](https://developer.mozilla.org/en-US/docs/Learn/Server-side/Express_Nodejs/mongoose#testing_%E2%80%94_create_some_items) will help you with that.

After these steps, you need to install the dependencies. For that, you can write `npm install` in the terminal. This will install all the dependencies the project needs.

Now to run a local server, enter `npm run start` (you can also write `npm run startserver` to use [nodemon](https://github.com/remy/nodemon)). After starting the server, you can open a browser and write `127.0.0.1:3000` in the address bar. You should see the homepage now.

If you want to see a live preview, please send me an email.
