var express = require('express');
var router = express.Router();
var passport = require('passport')
var nodemailer = require('nodemailer')

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USERNAME,
    pass: process.env.EMAIL_PASSWORD
  }
});

const {
  check,
  validationResult
} = require('express-validator/check');

const bcrypt = require('bcryptjs')
const saltRounds = 10;

/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('home', {
    title: 'Test Session'
  });
});

//get the map for guilds
router.get('/map', authenticationMiddleware(), function (req, res, next) {
  res.render('map', {
    title: "lemon[GRAFT] Guild Location Selctor"
  })
})

router.get('/profile', authenticationMiddleware(), function (req, res, next) {

  const db = require('../db.js')

  db.query('SELECT username, email FROM accounts WHERE id = ?', [req.session.passport.user.user_id], function (err, results, fields) {

    if (err) throw err
    res.render('profile', {
      title: 'profile',
      name: results[0].username,
      email: results[0].email
    });
    db.end()
  })
});

//#region Update Stuff


router.post('/updateUsername', authenticationMiddleware(), [check('newUsername', 'Username can only contain letters, numbers, or underscores.').matches(/^[A-Za-z0-9_-]+$/, 'i'),
  check('newUsername', 'Username field cannot be empty.').not().isEmpty(),
  check('newUsername', 'Username must be between 4-15 characters long.').isLength({
    min: 4,
    max: 15
  }),
], function (req, res, next) {

  const db = require('../db.js')
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    db.query('SELECT username, email WHERE id = ?', [req.session.passport.user.user_id], function (err, results, fields) {

      if (err) throw err
      res.render('profile', {
        title: 'profile',
        name: results[0].username,
        email: results[0].email,
        error: errors.array()
      });
      db.end()
    })
  } else {
    db.query('UPDATE accounts SET username = ? WHERE id = ?', [req.body.newUsername, req.session.passport.user.user_id], function (err, results, fields) {

      if (err) throw err
      res.redirect('/profile')
      db.end()
    })
  }
})

router.post('/updateEmail', authenticationMiddleware(), [check('newEmail', 'The email you entered is invalid, please try again.').isEmail(),
  check('newEmail', 'Email field cannot be empty.').not().isEmpty(),
  check('newEmail', 'Email address must be between 4-100 characters long, please try again.').isLength({
    min: 4,
    max: 100
  }),
], function (req, res, next) {

  const db = require('../db.js')
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    db.query('SELECT username, email FROM accounts WHERE id = ?', [req.session.passport.user.user_id], function (err, results, fields) {

      if (err) throw err
      res.render('profile', {
        title: 'profile',
        name: results[0].username,
        email: results[0].email,
        error: errors.array()
      });
      db.end()
    })
  } else {
    db.query('UPDATE accounts SET email = ? WHERE id = ?', [req.body.newEmail, req.session.passport.user.user_id], function (err, results, fields) {

      if (err) throw err
      res.redirect('/profile')
      db.end()
    })
  }
})

router.post('/updatePassword', authenticationMiddleware(), [check('newPassword', 'Password must be between 8-100 characters long.').isLength({
    min: 8,
    max: 100
  }),
  check('newPasswordMatch', 'Password must be between 8-100 characters long.').isLength({
    min: 8,
    max: 100
  }),
  check('newPassword').isLength({
    min: 8,
    max: 100
  })
  .custom((value, {
    req,
    loc,
    path
  }) => {
    if (value !== req.body.newPasswordMatch) {
      return false;
    } else {
      return value;
    }
  }).withMessage("Passwords don't match."),
], function (req, res, next) {


  const db = require('../db.js')
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    db.query('SELECT username, email FROM accounts WHERE id = ?', [req.session.passport.user.user_id], function (err, results, fields) {

      if (err) throw err
      res.render('profile', {
        title: 'profile',
        name: results[0].username,
        email: results[0].email,
        error: errors.array()
      });
      db.end()
    })
  } else {
    bcrypt.hash(req.body.newPassword, saltRounds, function (err, hash) {
      db.query('UPDATE accounts SET password = ? WHERE id = ?', [hash, req.session.passport.user.user_id], function (err, results, fields) {

        if (err) throw err
        res.redirect('/profile')
        db.end()
      })
    })
  }
})
//#endregion 

router.get('/login', function (req, res, next) {
  res.render('login', {
    title: '[lemon]GRAFT Login'
  });
});

router.post('/login', passport.authenticate('local', {
  successRedirect: '/tfa',
  failureRedirect: '/login'
}))

router.get('/logout', function (req, res, next) {
  req.logout()
  req.session.destroy()
  res.redirect('/')
});

router.get('/register', function (req, res, next) {
  res.render('register', {
    title: 'Registration'
  });
});

router.post('/register', [
    check('username', 'Username can only contain letters, numbers, or underscores.').matches(/^[A-Za-z0-9_-]+$/, 'i'),
    check('username', 'Username field cannot be empty.').not().isEmpty(),
    check('username', 'Username must be between 4-15 characters long.').isLength({
      min: 4,
      max: 15
    }),
    check('email', 'The email you entered is invalid, please try again.').isEmail(),
    check('email', 'Email address must be between 4-100 characters long, please try again.').isLength({
      min: 4,
      max: 100
    }),
    check('password', 'Password must be between 8-100 characters long.').isLength({
      min: 8,
      max: 100
    }),
    check('passwordMatch', 'Password must be between 8-100 characters long.').isLength({
      min: 8,
      max: 100
    }),
    check('password').isLength({
      min: 8,
      max: 100
    })
    .custom((value, {
      req,
      loc,
      path
    }) => {
      if (value !== req.body.passwordMatch) {
        return false;
      } else {
        return value;
      }
    }).withMessage("Passwords don't match."),
  ],
  function (req, res, next) {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      res.render('register', {
        title: 'Registration Error',
        error: errors.array()
      })
    } else {
      //user data from form  
      const username = req.body.username
      const email = req.body.email
      const password = req.body.password

      //database connection to query
      const db = require('../db.js')

      //do database stuff here
      bcrypt.hash(password, saltRounds, function (err, hash) {
        db.query('INSERT INTO accounts (username, email, password) VALUES (?, ?, ?)', [username, email, hash], function (err, results, fields) {

          if (err) throw err;

          db.query('SELECT LAST_INSERT_ID() as user_id', function (error, results, fields) {
            if (error) throw error

            console.log(results[0])

            const user_id = results[0]

            req.login(user_id, function (err) {
              res.redirect('/tfa')
            })
          })
          db.end()
        })
      });
    }
  });

//#region guild builder functions

router.get('/guild', authenticationMiddleware(), function (req, res, next) {
  res.render('guild', {
    title: "Guild Builder",
    user: req.body.name,
    lat: req.session.lat,
    lon: req.session.lon
  })
})

router.post('/guild', function (req, res, next) {
  console.log("Recived: " + req.body.lat)
  console.log("Recived: " + req.body.lon)
  req.session.lat = req.body.lat
  req.session.lon = req.body.lon

  res.render('guild', {
    title: "Guild Builder",
    user: req.body.name,
    lat: req.body.lat,
    lon: req.body.lon
  })
})

//two factor authentication

router.get('/tfa', authenticationMiddleware(), function (req, res, next) {

  const db = require('../db')

  db.query('SELECT email FROM accounts WHERE id =' + req.session.passport.user.user_id, function (err, results, fields) {
    console.log(req.session.passport.user.user_id)
    console.log(results[0].email)
    if (err) throw err
    const mailOptions = {
      from: 'bond98041@gmail.com',
      to: results[0].email,
      subject: 'TFA',
      text: generate()
    };

    req.session.text = mailOptions.text

    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.log(error);
      } else {
        console.log('Email sent: ' + info.response);
      }
    });
    res.render('tfa', {
      title: 'Two Factor Authentication',
      error: ''
    });
    //db.end()
  })
});

router.post('/tfa', function (req, res, next) {
  if (req.body.tfa == req.session.text) {
    res.redirect('/profile')
  } else {
    res.render('tfa', {
      title: 'Two Factor Authentication',
      error: 'Not correct code'
    })
  }
})

//#endregion
passport.serializeUser(function (user_id, done) {
  done(null, user_id);
});

passport.deserializeUser(function (user_id, done) {
  done(null, user_id);
});

function authenticationMiddleware() {
  return (req, res, next) => {
    console.log(`req.session.passport.user: ${JSON.stringify(req.session.passport)}`);

    if (req.isAuthenticated()) return next();
    res.redirect('/login')
  }
}

function generate_random_string(string_length) {
  let random_string = '';
  let random_ascii;
  let ascii_low = 65;
  let ascii_high = 90
  for (let i = 0; i < string_length; i++) {
    random_ascii = Math.floor((Math.random() * (ascii_high - ascii_low)) + ascii_low);
    random_string += String.fromCharCode(random_ascii)
  }
  return random_string
}

function generate_random_number() {
  let num_low = 1;
  let num_high = 9;
  return Math.floor((Math.random() * (num_high - num_low)) + num_low);
}

function generate() {
  return generate_random_string(6) + generate_random_number()
}

console.log(generate())

module.exports = router;