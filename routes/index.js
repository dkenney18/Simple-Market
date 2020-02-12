var express = require('express');
var router = express.Router();
var passport = require('passport')

const {
  check,
  validationResult
} = require('express-validator/check');

const bcrypt = require('bcryptjs')
const saltRounds = 10;

/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('home', {
    title: 'SimpleMarket'
  });
});

router.get('/profile', authenticationMiddleware(), function (req, res, next) {

  const db = require('../db.js')

  db.query('SELECT username, email FROM users WHERE id = ?', [req.session.passport.user.user_id], function (err, results, fields) {
    const result = results
    db.query('SELECT * FROM items WHERE seller = ?', [req.session.passport.user.user_id], function (err, results, fields) {
      if (err) throw err
      res.render('profile', {
        title: 'profile',
        name: result[0].username,
        email: result[0].email,
        item: results
      });
    })
  });
});

router.get('/login', function (req, res, next) {
  res.render('login', {
    title: 'SimpleMarket Login'
  });
});

router.post('/login', passport.authenticate('local', {
  successRedirect: '/profile',
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
        db.query('INSERT INTO users (username, email, password, money) VALUES (?, ?, ?, ?)', [username, email, hash, 0], function (err, results, fields) {

          if (err) throw err;

          db.query('SELECT LAST_INSERT_ID() as user_id', function (error, results, fields) {
            if (error) throw error

            const user_id = results[0]

            req.login(user_id, function (err) {
              res.redirect('/profile')
            })
          })

        })
      });
    }
  });

//sell item view and post logic
router.get('/sell', function (req, res, next) {
  res.render('sell', {
    title: 'Simple Market Sell Items'
  })
})

router.post('/sell',  [
  check('itemName', 'Item Name can only contain letters, numbers, or underscores.').matches(/^[A-Za-z0-9_-]+$/, 'i'),
  check('itemName', 'Item Name field cannot be empty.').not().isEmpty(),
  check('itemPrice', 'Item Price can only contain letters, numbers, or underscores.').matches(/^[0-9_-]+$/, 'i'),
  check('itemPrice', 'Item Pricefield cannot be empty.').not().isEmpty(),
  check('itemDescription', 'Item Price can only contain letters, numbers, or underscores.').matches(/^[A-Za-z0-9_-]+$/, 'i'),
  check('itemDescription', 'Item Pricefield cannot be empty.').not().isEmpty(),
  check('itemQuantity', 'Item Price can only contain letters, numbers, or underscores.').matches(/^[0-9_-]+$/, 'i'),
  check('itemQuantity', 'Item Pricefield cannot be empty.').not().isEmpty(),
], function (req, res, next) {
  const db = require('../db')
  const errors = validationResult(req);

    if (!errors.isEmpty()) {
      res.render('sell', {
        title: 'Sell error',
        error: errors.array()
      })
    } else {
      db.query('INSERT INTO items (name, price, description, seller, sold, quantity) VALUES (?, ?, ?, ?, ?, ?)', [req.body.itemName, req.body.itemPrice, req.body.itemDescription, req.session.passport.user.user_id, false, req.body.itemQuantity], function (err, results, fields) {
        if (err) throw err
    
        res.redirect('/market')
    
    
      })
    }
})

//market view and post logic
router.get('/market', function (req, res, next) {
  const db = require('../db')

  db.query('SELECT * FROM items', function (err, results, fields) {
    if (err) throw err
    res.render(
      'market', {
        title: 'Simple Market market',
        item: results
      })
  })
})

//market post logic
router.get('/market/:itemID', function (req, res, next) {
  const item_id = req.params.itemID
  const db = require('../db')
  //get money and price to subtract
  db.query('SELECT money FROM users WHERE ID = ? UNION SELECT price FROM items WHERE ID = ?', [req.session.passport.user.user_id, item_id], function (err, results, fields) {
    if (err) throw err
    var money = results[0].money - results[1].money
    //update money for the current user 
    db.query('UPDATE users SET money = ? WHERE ID = ?', [money, req.session.passport.user.user_id], function (err, results, fields) {
      if (err) throw err
      db.query('SELECT seller FROM items WHERE ID = ?', [item_id], function(err, results, fields) {
        if (err) throw err
        const seller_id = results[0].seller
        db.query('SELECT money FROM users WHERE ID = ? UNION SELECT price FROM items WHERE ID = ?', [seller_id, item_id], function(err, results, fields) {
          if (err) throw err
          var seller_money = results[0].money
          var item_price = results[1].money
          var money = seller_money + item_price
          db.query('UPDATE users SET money = ? WHERE ID = ?', [money, seller_id], function(err, results, fields) {

            db.query('DELETE FROM items WHERE ID = ?', [item_id], function (err, results, fields) {
              if (err) throw err
              res.redirect('/market')
            })
          })
        })
      })
    })
  })
})


//bank logic
router.get('/bank', function (req, res, next) {
  const db = require('../db')

  db.query('SELECT money FROM users WHERE id = ?', [req.session.passport.user.user_id], function (err, results, fields) {
    if (err) throw err
    res.render(
      'bank', {
        title: 'Simple Bank',
        money: results[0].money
      })
  })
})

router.post('/bank', function (req, res, next) {
  const db = require('../db')
  db.query('SELECT money FROM users WHERE ID = ?', [req.session.passport.user.user_id], function (err, results, fields) {
    var userMoney = results[0].money 
    var desposit = parseInt(req.body.desposit)
    var money = userMoney + desposit
    db.query('UPDATE users SET money = ? WHERE id = ?', [money, req.session.passport.user.user_id], function (err, results, fields) {
      if (err) throw err
      db.query('SELECT money FROM users WHERE ID = ?', [req.session.passport.user.user_id], function(err, results, fields) {
        if (err) throw err 
        res.render(
          'bank', {
            title: 'Simple Bank',
            money: results[0].money
          })
      })
    })
  })
})


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

module.exports = router;