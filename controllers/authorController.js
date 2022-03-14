const Author = require('../models/author');
const Book = require('../models/book');
const { body, validationResult } = require('express-validator');
const { decode } = require('../unescape');

// display list of all authors
exports.author_list = function (req, res) {
  new Promise((resolve, reject) => {
    Author.find()
      .sort({ family_name: 1 })
      .exec(function (err, list_authors) {
        if (err) reject(err);
        else {
          res.render('author_list', {
            title: 'Author List',
            author_list: list_authors,
          });
        }
      });
  })
};

// display detail page for a specific author
exports.author_detail = function (req, res, next) {
  let author = new Promise((resolve, reject) => {
    Author.findById(req.params.id)
      .exec((err, author) => {
        if (err) reject(err);
        else resolve(author);
      });
  });

  let authorBooks = new Promise((resolve, reject) => {
    Book.find({ author: req.params.id }, 'title summary')
      .exec((err, books) => {
        if (err) reject(err);
        else resolve(books);
      });
  });

  Promise.all([author, authorBooks])
    .then((arr) => {
      let [ author, authorBooks ] = arr;

      if (author === null) {
        let err = new Error('Author not found');
        err.status = 404;
        throw err;
      }

      // unescape encoded HTML entities so the user see them normally
      author.first_name = decode(author.first_name);
      author.family_name = decode(author.family_name);
      authorBooks.forEach((book) => {
        book.title = decode(book.title);
        book.summary = decode(book.summary);
      });

      res.render('author_detail', {
        title: 'Author Detail',
        author: author,
        author_books: authorBooks,
      })
    })
    .catch(next);
};

// display author create form on GET
exports.author_create_get = function (req, res) {
  res.render('author_form', { title: 'Create Author' });
};

// handle author create on POST
exports.author_create_post = [
  body('first_name')
    .trim()
    .isLength({ min: 1 })
    .escape()
    .withMessage('First name must be specified')
    .isAlphanumeric()
    .withMessage('First name has non-alphanumeric characters'),
  body('family_name')
    .trim()
    .isLength({ min: 1 })
    .escape()
    .withMessage('Family name must be specified')
    .isAlphanumeric()
    .withMessage('Family name has non-alphanumeric characters'),
  body('date_of_birth', 'Invalid date of birth')
    .optional({ checkFalsy: true })
    .isISO8601()
    .toDate(),
  body('date_of_death', 'Invalid date of death')
    .optional({ checkFalsy: true })
    .isISO8601()
    .toDate(),

  // process request after validation and sanitization
  (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      res.render('author_form', {
        title: 'Create Author',
        author: req.body,
        errors: errors.array(),
      });
    } else {
      // create an Author object with escaped and trimmed data
      let author = new Author({
        first_name: req.body.first_name,
        family_name: req.body.family_name,
        date_of_birth: req.body.date_of_birth,
        date_of_death: req.body.date_of_death,
      });

      new Promise((resolve, reject) => {
        author.save((err) => {
          if (err) reject(err);
          else res.redirect(author.url);
        })  
      })
        .catch(next);
    }
  },
];

// display author delete form on GET
exports.author_delete_get = function (req, res, next) {
  let author = new Promise((resolve, reject) => {
    Author.findById(req.params.id)
      .exec((err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
  });

  let authorBooks = new Promise((resolve, reject) => {
    Book.find({ author: req.params.id })
      .exec((err, books) => {
        if (err) reject(err);
        else resolve(books);
      });
  });

  Promise.all([author, authorBooks])
    .then((arr) => {
      let [ author, authorBooks ] = arr;

      if (author === null) 
        res.redirect('/catalog/authors');

      // unescape encoded HTML entities so the user can see them normally
      author.first_name = decode(author.first_name);
      author.family_name = decode(author.family_name);
      authorBooks.forEach((book) => {
        book.title = decode(book.title);
        book.summary = decode(book.summary);
      });

      res.render('author_delete', {
        title: 'Delete Author',
        author: author,
        author_books: authorBooks,
      });
    })
    .catch(next);
};

// handle author delete on POST
exports.author_delete_post = function (req, res, next) {
  let author = new Promise((resolve, reject) => {
    Author.findById(req.params.id)
      .exec((err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
  });

  let authorBooks = new Promise((resolve, reject) => {
    Book.find({ author: req.params.id })
      .exec((err, books) => {
        if (err) reject(err);
        else resolve(books);
      });
  });

  Promise.all([author, authorBooks])
    .then((arr) => {
      let [ author, authorBooks ] = arr;

      if (authorBooks.length > 0) {
        // unescape encoded HTML entities so the user see them normally
        author.first_name = decode(author.first_name);
        author.family_name = decode(author.family_name);
        authorBooks.forEach((book) => {
          book.title = decode(book.title);
          book.summary = decode(book.summary);
        });

        res.render('author_delete', {
          title: 'Delete Author',
          author: author,
          author_books: authorBooks,
        });
      }
      else {
        Author.findByIdAndDelete(req.body.authorId, (err) => {
          if (err) throw err;
          
          res.redirect('/catalog/authors');
        });
      }
    })
    .catch(next);
};

// display author update form on GET
exports.author_update_get = function (req, res, next) {
  new Promise((resolve, reject) => {
    Author.findById(req.params.id, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  })
    .then((author) => {
      if (author === null) {
        let error = new Error('Author not found');
        error.status = 404;
        throw error;
      }

      // unescape encoded HTML entities so the user see them normally
      author.first_name = decode(author.first_name);
      author.family_name = decode(author.family_name);

      res.render('author_form', {
        title: 'Update Author',
        author: author,
      });
    })
    .catch(next);
};

// handle author update on POST
exports.author_update_post = [
  body('first_name')
    .trim()
    .isLength({ min: 1 })
    .escape()
    .withMessage('First name must be specified')
    .isAlphanumeric()
    .withMessage('First name has non-alphanumeric characters'),
  body('family_name')
    .trim()
    .isLength({ min: 1 })
    .escape()
    .withMessage('Family name must be specified')
    .isAlphanumeric()
    .withMessage('Family name has non-alphanumeric characters'),
  body('date_of_birth', 'Invalid date of birth')
    .optional({ checkFalsy: true })
    .isISO8601()
    .toDate(),
  body('date_of_death', 'Invalid date of death')
    .optional({ checkFalsy: true })
    .isISO8601()
    .toDate(),

  // process request after validation and sanitization
  (req, res, next) => {
    // extract the validation errors from a request
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      // unescape encoded HTML entities so the user see them normally
      req.body.first_name = decode(req.body.first_name);
      req.body.family_name = decode(req.body.family_name);

      res.render('author_form', {
        title: 'Update Author',
        author: req.body,
        errors: errors.array(),
      });
    }
    else {
      let author = new Author({
        first_name: req.body.first_name,
        family_name: req.body.family_name,
        date_of_birth: req.body.date_of_birth,
        date_of_death: req.body.date_of_death,
        _id: req.params.id, // required, or else a new object will be created
      });

      new Promise((resolve, reject) => {
        Author.findByIdAndUpdate(req.params.id, author, {}, (err, theAuthor) => {
          if (err) reject(err);
          else (resolve(theAuthor));
        });
      })
        .then((result) => {
          res.redirect(result.url);
        })
        .catch(next);
    }
  }
];
