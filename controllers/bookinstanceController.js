const BookInstance = require('../models/bookinstance');
const Book = require('../models/book');
const { body, validationResult } = require('express-validator');
const { decode } = require('../unescape');

// display list of all bookInstances
exports.bookinstance_list = function (req, res) {
  BookInstance.find()
    .populate('book')
    .sort({ status: 1 })
    .exec(function (err, list_bookInstances) {
      if (err) return next(err);

      // unescape encoded HTML entities so the user see them normally
      list_bookInstances.forEach((instance) => {
        instance.imprint = decode(instance.imprint);
        instance.book.title = decode(instance.book.title);
      });

      res.render('bookinstance_list', {
        title: 'Book Instance List',
        bookinstance_list: list_bookInstances,
      });
    });
};

// display detail page for a specific bookInstance
exports.bookinstance_detail = function (req, res, next) {
  BookInstance.findById(req.params.id)
    .populate('book')
    .exec(function (err, bookInstance) {
      if (err) return next(err);
      
      if (bookInstance == null) {
        let err = new Error('Book copy not found');
        err.status = 404;
        return next(err);
      }

      // unescape encoded HTML entities so the user see them normally
      bookInstance.imprint = decode(bookInstance.imprint);
      bookInstance.book.title = decode(bookInstance.book.title);
      
      res.render(
        'bookinstance_detail', 
        {
          title: `Copy: ${bookInstance.book.title}`,
          bookinstance: bookInstance,
        }
      );
    });
};

// display bookInstance create form on GET
exports.bookinstance_create_get = function (req, res, next) {
  new Promise((resolve, reject) => {
    Book.find({}, 'title')
      .exec((err, books) => {
        if (err) reject(err);
        else resolve(books);
      });
  })
    .then((books) => {
      // unescape encoded HTML entities so the user see them normally
      books.forEach((book) => {
        book.title = decode(book.title);
      });

      res.render('bookinstance_form', {
        title: 'Create Book Instance',
        book_list: books,
      });
    })
    .catch(next);
};

// handle bookInstance create on POST
exports.bookinstance_create_post = [

  // validate and sanitize fields.
  body('book', 'Book must be specified').trim().isLength({ min: 1 }).escape(),
  body('imprint', 'Imprint must be specified').trim().isLength({ min: 1 }).escape(),
  body('status').escape(),
  body('due_back', 'Invalid date').optional({ checkFalsy: true }).isISO8601().toDate(),

  // process request after validation and sanitization.
  (req, res, next) => {
      const errors = validationResult(req);

      // create a BookInstance object with escaped and trimmed data.
      var bookInstance = new BookInstance({ 
        book: req.body.book,
        imprint: req.body.imprint,
        status: req.body.status,
        due_back: req.body.due_back
      });

      if (!errors.isEmpty()) {
        new Promise((resolve, reject) => {
          Book.find({}, 'title')
            .exec((err, books) => {
              if (err) reject(err);
              else resolve(books);
            });
        })
          .then((books) => {
            // unescape encoded HTML entities so the user see them normally
            bookInstance.imprint = decode(bookInstance.imprint);
            books.forEach((book) => {
              book.title = decode(book.title);
            });
      
            res.render('bookinstance_form', { 
              title: 'Create Book Instance', 
              book_list: books, 
              selected_book: bookInstance.book , 
              errors: errors.array(), 
              bookinstance: bookInstance 
            });
          })
          .catch(next);
      }
      else {
        bookInstance.save(function (err) {
          if (err) return next(err);
              
          res.redirect(bookInstance.url);
        });
      }
  }
];

// display bookInstance delete form on GET
exports.bookinstance_delete_get = function (req, res, next) {
  new Promise ((resolve, reject) => {
    BookInstance.findById(req.params.id)
      .populate('book')
      .exec((err, instance) => {
        if (err) reject(err);
        else resolve(instance);
      })
  })
  .then((instance) => {
    if (instance === null) res.redirect('/catalog/bookinstances');

    // unescape encoded HTML entities so the user see the normally
    instance.imprint = decode(instance.imprint);
    instance.book.title = decode(instance.book.title);

    res.render('bookinstance_delete', {
      title: 'Delete Book Instance',
      bookInstance: instance,
    });
  })
  .catch(next);
};

// handle bookInstance delete on POST
exports.bookinstance_delete_post = function (req, res, next) {
  new Promise ((resolve, reject) => {
    BookInstance.findByIdAndDelete(req.params.id, (err) => {
      if (err) {
        reject(err);
        return;
      }

      res.redirect('/catalog/bookinstances');
    })
  }).catch(next);
};

// display bookInstance update form on GET
exports.bookinstance_update_get = function (req, res, next) {
  let instance = new Promise((resolve, reject) => {
    BookInstance.findById(req.params.id)
      .populate('book')
      .exec((err, result) => {
        if (err) reject(err)
        else resolve(result);
      });
  });

  let bookList = new Promise((resolve, reject) => {
    Book.find({}, 'title')
      .exec((err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
  });

  Promise.all([instance, bookList])
    .then((value) => {
      let [instance, bookList] = value;

      if (instance === null) {
        let err = new Error('Book Instance not found');
        err.status = 404;
        throw err;
      }

      // unescape encoded HTML entities so the user see them normally
      instance.imprint = decode(instance.imprint);
      bookList.forEach((book) => {
        book.title = decode(book.title);
      });

      res.render('bookinstance_form', {
        title: 'Update Book Instance',
        bookinstance: instance,
        book_list: bookList,
        selected_book: instance.book,
      });
    })
    .catch(next);
};

// handle bookInstance update on POST
exports.bookinstance_update_post = [
  body('book', 'Book must be specified').trim().isLength({ min: 1 }).escape(),
  body('imprint', 'Imprint must be specified').trim().isLength({ min: 1 }).escape(),
  body('status').escape(),
  body('due_back', 'Invalid date').optional({ checkFalsy: true }).isISO8601().toDate(),

  // process request after validation and sanitization
  (req, res, next) => {
    const errors = validationResult(req);

    let bookInstance = new BookInstance({
      book: req.body.book,
      imprint: req.body.imprint,
      status: req.body.status,
      due_back: req.body.due_back,
      _id: req.params.id,
    });

    if (!errors.isEmpty()) {
      new Promise((resolve, reject) => {
        Book.find({}, 'title')
          .exec((err, books) => {
            if (err) reject(err);
            else resolve(books);
          });
      })
        .then((books) => {
          // unescape encoded encoded HTML entities so the user see them normally
          bookInstance.imprint = decode(bookInstance.imprint);
          books.forEach((book) => {
            book.title = decode(book.title);
          });

          res.render('bookinstance_form', {
            title: 'Update Book Instance',
            book_list: books,
            selected_book: bookInstance.book,
            bookinstance: bookInstance,
            errors: errors.array(),
          })
        })
        .catch(next);
    }
    else {
      new Promise((resolve, reject) => {
        BookInstance.findByIdAndUpdate(req.params.id, bookInstance, {}, (err, theInstance) => {
          if (err) reject(err);
          else resolve(theInstance);
        });
      })
        .then((instance) => {
          res.redirect(instance.url);
        })
        .catch(next);
    }
  }
]
