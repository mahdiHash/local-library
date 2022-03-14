const Book = require('../models/book');
const Author = require('../models/author');
const Genre = require('../models/genre');
const BookInstance = require('../models/bookinstance');
const { body, validationResult } = require('express-validator');
const { decode } = require('../unescape');

exports.index = function (req, res, next) {
  new Promise(async (resolve, reject) => {
    try {
      let results = {
        book_count: await Book.estimatedDocumentCount(),
        book_instance_count: await BookInstance.estimatedDocumentCount(),
        book_instance_available_count: await BookInstance.estimatedDocumentCount(),
        author_count: await Author.estimatedDocumentCount(),
        genre_count: await Genre.estimatedDocumentCount(),
      };
      resolve(results);
    }
    catch (err) {
      reject(err)
    }
  })
    .then((results) => {
      res.render('index', {
        title: 'Local Library Home',
        data: results,
      });
    })
    .catch((err) => {
      res.render('index', { error: err });
    });
};

// display list of all books.
exports.book_list = function (req, res, next) {
  new Promise((resolve, reject) => {
    Book.find({}, 'title author')
    .sort({ title: 1 })
    .populate('author')
    .exec(function (err, list_books) {
      if (err) reject(err);
      else resolve(list_books);
    });
  })
    .then((books) => {
      // unescape encoded HTML entities so the user see them normally
      books.forEach((book) => {
        book.title = decode(book.title);
        book.author.name = decode(book.author.name);
      })

      res.render('book_list', { 
        title: 'Book List', 
        book_list: books, 
      });
    })
    .catch(next);
};

// display detail page for a specific book.
exports.book_detail = function (req, res, next) {
  let book = new Promise((resolve, reject) => {
    Book.findById(req.params.id)
      .populate('author')
      .populate('genre')
      .exec((err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
  });

  let bookInstances = new Promise((resolve, reject) => {
    BookInstance.find({ book: req.params.id })
      .exec((err, instances) => {
        if (err) reject(err);
        else resolve(instances);
      });
  });

  Promise.all([ book, bookInstances ])
    .then((arr) => {
      let [ book, instances ] = arr;

      if (book === null) {
        let err = new Error('Book not found');
        err.status = 404;
        throw err;
      }

      // unescape encoded HTML entities so the user see them normally
      book.title = decode(book.title);
      book.author.name = decode(book.author.name);
      book.summary = decode(book.summary);
      book.genre.name = decode(book.genre.name);
      instances.forEach((instance) => {
        instance.imprint = decode(instance.imprint);
      });

      res.render('book_detail', {
        title: book.title,
        book: book,
        book_instances: instances,
      });
    })
    .catch(next);
};

// display book create form on GET.
exports.book_create_get = function (req, res, next) {
  let authors = new Promise((resolve, reject) => {
    Author.find({}, (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  });

  let genres = new Promise((resolve, reject) => {
    Genre.find({}, (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  });

  Promise.all([ authors, genres ])
    .then((arr) => {
      let [ authors, genres ] = arr;

      // unescape encoded HTML entities so the user see them normally
      authors.forEach((author) => {
        author.name = decode(author.name);
      });
      genres.forEach((genre) => {
        genre.name = decode(genre.name);
      });

      res.render('book_form', {
        title: 'Create Book',
        authors: authors,
        genres: genres,
      })
    })
    .catch(next);
};

// handle book create on POST.
exports.book_create_post = [
  // convert the genre to an array
  (req, res, next) => {
    let reqGenre = req.body.genre;
    if (!(reqGenre instanceof Array)) {
      if (typeof reqGenre === 'undefined') reqGenre = [];
      else reqGenre = new Array(reqGenre);
    }
    next();
  },

  // validate and sanitize fields
  body('title', 'Title must not be empty.')
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body('author', 'Author must not be empty.')
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body('summary', 'Summary must not be empty.')
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body('isbn', 'ISBN must not be empty').trim().isLength({ min: 1 }).escape(),
  body('genre.*').escape(),

  // process request after validation and sanitization
  (req, res, next) => {
    const errors = validationResult(req);

    // create book objects with escaped and trimmed data
    let book = new Book({
      title: req.body.title,
      author: req.body.author,
      summary: req.body.summary,
      isbn: req.body.isbn,
      genre: req.body.genre,
    });

    if (!errors.isEmpty()) {
      Promise.all(
        [
          // get all authors
          new Promise((resolve, reject) => {
            Author.find({}, (err, results) => {
              if (err) reject(err);
              else resolve(results);
            });
          }),
          
          // get all genres
          new Promise((resolve, reject) => {
            Genre.find({}, (err, results) => {
              if (err) reject(err);
              else resolve(results);
            });
          })
        ]
      )
        .then((arr) => {
          let [ authors, genres ] = arr;

          // mark the selected genres as checked
          for (let i = 0; i < genres.length; i++) {
            if (book.genre.includes(genres[i]._id))
              genres[i].checked = 'true';
          }

          // unescape encoded HTML entities so the user see them normally
          authors.forEach((author) => {
            author.name = decode(author.name);
          });
          genres.forEach((genre) => {
            genre.name = decode(genre.name);
          });
          book.title = decode(book.title);
          book.author.name = decode(book.author.name);
          book.summary = decode(book.summary);
          book.genre.name = decode(book.genre.name);

          res.render('book_form', {
            title: 'Create Book',
            authors: authors,
            genres: genres,
            book: book,
            errors: errors.array(),
          });
        });
    } 
    else {
      book.save(function (err) {
        if (err) return next(err);

        res.redirect(book.url);
      });
    }
  },
];

// display book delete form on GET.
exports.book_delete_get = function (req, res, next) {
  let book = new Promise ((resolve, reject) => {
    Book.findById(req.params.id)
    .exec((err, result) => {
      if (err) reject(err);
      else resolve(result);
    })
  });

  let bookInstances = new Promise ((resolve, reject) => {
    BookInstance.find({ book: req.params.id })
    .exec((err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  });

  Promise.all([book, bookInstances])
  .then((value) => {
    let [book, bookInstances] = value;

    if (book == null) res.redirect('/catalog/books');

    // unescape encoded HTML entities so the user see them normally
    book.title = decode(book.title);
    bookInstances.forEach((instance) => {
      instance.imprint = decode(instance.imprint);
    });

    res.render('book_delete', {
      title: 'Delete Book',
      book: book,
      bookInstances: bookInstances,
    })
  })
  .catch(next);
};

// handle book delete on POST.
exports.book_delete_post = function (req, res, next) {
  let book = new Promise ((resolve, reject) => {
    Book.findById(req.params.id)
    .exec((err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });

  let bookInstances = new Promise ((resolve, reject) => {
    BookInstance.find({ book: req.params.id })
    .exec((err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  });

  Promise.all([book, bookInstances])
  .then((value) => {
    let [book, bookInstances] = value;

    if (bookInstances.length > 0) {
      // unescape encoded HTML entities so the user see them normally
      book.title = decode(book.title);
      bookInstances.forEach((instance) => {
        instance.imprint = decode(instance.imprint);
      });

      res.render('book_delete', {
        title: 'Delete Book',
        book: book,
        bookInstances: bookInstances,
      });
    }
    else {
      Book.findByIdAndRemove(req.body.bookId, (err) => {
        if (err) throw err;

        res.redirect('/catalog/books');
      });
    }
  })
  .catch(next);
};

// display book update form on GET.
exports.book_update_get = function (req, res, next) {
  let book = new Promise((resolve, reject) => {
    Book.findById(req.params.id)
      .populate('author')
      .populate('genre')
      .exec((err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
  });

  let authors = new Promise((resolve, reject) => {
    Author.find({}, (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  });

  let genres = new Promise((resolve, reject) => {
    Genre.find({}, (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  });

  Promise.all([book, authors, genres])
    .then((arr) => {
      let [ book, authors, genres ] = arr;

      if (book === null) {
        let err = new Error('Book not found');
        err.status = 404;
        throw err;
      }

      // unescape encoded HTML entities so the user see them normally
      authors.forEach((author) => {
        author.name = decode(author.name);
      });
      genres.forEach((genre) => {
        genre.name = decode(genre.name);
      });
      book.title = decode(book.title);
      book.author.name = decode(book.author.name);
      book.summary = decode(book.summary);
      book.genre.name = decode(book.genre.name);

      // mark our selected genres as checked
      let allGenLen = genres.length;
      let bookGenLen = book.genre.length;
      for (let all_g_iter = 0; all_g_iter < allGenLen; all_g_iter++) {
        for (let book_g_iter = 0; book_g_iter < bookGenLen; book_g_iter++) {
          if (
            genres[all_g_iter]._id.toString() ===
            book.genre[book_g_iter]._id.toString()
          ) {
            genres[all_g_iter].checked = 'true';
          }
        }
      }

      res.render('book_form', {
        title: 'Update Book',
        authors: authors,
        genres: genres,
        book: book,
      });
    })
    .catch(next);
};

// handle book update on POST.
exports.book_update_post = [
  (req, res, next) => {
    if (!(req.body.genre instanceof Array)) {
      if (typeof req.body.genre === 'undefined') req.body.genre = [];
      else req.body.genre = new Array(req.body.genre);
    }
    next();
  },

  body('title', 'Title must not be empty.').trim().isLength({ min: 1 }).escape(),
  body('author', 'Author must not be empty.').trim().isLength({ min: 1 }).escape(),
  body('summary', 'Summary must not be empty.').trim().isLength({ min: 1 }).escape(),
  body('isbn', 'ISBN must not be empty').trim().isLength({ min: 1 }).escape(),
  body('genre.*').escape(),

  (req, res, next) => {
    const errors = validationResult(req);

    // create a Book object with escaped/trimmed data and old id.
    let book = new Book({
      title: req.body.title,
      author: req.body.author,
      summary: req.body.summary,
      isbn: req.body.isbn,
      genre: typeof req.body.genre === 'undefined' ? [] : req.body.genre,
      _id: req.params.id, //this is required, or a new ID will be assigned!
    });

    if (!errors.isEmpty()) {
      let authors = new Promise((resolve, reject) => {
        Author.find({}, (err, results) => {
          if (err) reject(err);
          else resolve(results);
        });
      });

      let genres = new Promise((resolve, reject) => {
        Genre.find({}, (err, results) => {
          if (err) reject(err);
          else resolve(results);
        });
      });

      Promise.all([authors, genres])
        .then((arr) => {
          let [ authors, genres ] = arr;

          // mark our selected genres as checked.
          for (let i = 0; i < genres.length; i++) {
            if (book.genre.includes(genres[i]._id)) {
              genres[i].checked = 'true';
            }
          }

          // unescape encoded HTML entities so the user see them normally
          authors.forEach((author) => {
            author.name = decode(author.name);
          });
          genres.forEach((genre) => {
            genre.name = decode(genre.name);
          });
          book.title = decode(book.title);
          book.author.name = decode(book.author.name);
          book.summary = decode(book.summary);
          book.genre.name = decode(book.genre.name);

          res.render('book_form', {
            title: 'Update Book',
            authors: authors,
            genres: genres,
            book: book,
            errors: errors.array(),
          });
        })
        .catch(next);
    } 
    else {
      Book.findByIdAndUpdate(req.params.id, book, {}, function (err, theBook) {
        if (err) {
          return next(err);
        }

        res.redirect(theBook.url);
      });
    }
  },
];
