const Genre = require('../models/genre');
const Book = require('../models/book');
const {body, validationResult} = require('express-validator');
const { decode } = require('../unescape');

// display list of all genre.
exports.genre_list = function (req, res, next) {
  Genre.find()
    .sort({ name: 1 })
    .exec(function (err, list_genres) {
      if (err) return next(err);

      // unescape encoded HTML entities so the user see them normally
      list_genres.forEach((genre) => {
        genre.name = decode(genre.name);
      });

      res.render('genre_list', {
        title: 'Genre List',
        genre_list: list_genres,
      });
    });
};

// display detail page for a specific genre.
exports.genre_detail = function (req, res, next) {
  let genre = new Promise((resolve, reject) => {
    Genre.findById(req.params.id)
      .exec((err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
  });

  let genreBooks = new Promise((resolve, reject) => {
    Book.find({ genre: req.params.id })
      .exec((err, books) => {
        if (err) reject(err);
        else resolve(books);
      });
  });

  Promise.all([genre, genreBooks])
    .then((arr) => {
      let [ genre, genreBooks ] = arr;

      if (genre === null) {
        let err = new Error('Genre not found');
        err.status = 404;
        throw err;
      }

      // unescape encoded HTML entities so the user see them normally
      genre.name = decode(genre.name);
      genreBooks.forEach((book) => {
        book.title = decode(book.title);
        book.summary = decode(book.summary);
      });

      res.render('genre_detail', 
        {
          title: 'Genre Detail',
          genre: genre,
          genre_books: genreBooks,
        }
      );
    })
    .catch(next);
};

// display genre create form on GET.
exports.genre_create_get = function (req, res) {
  res.render('genre_form', {title: 'Create Genre'});
};

// handle genre create on POST.
exports.genre_create_post = [

  // validate and sanitize the name field
  body('name', 'Genre name required').trim().isLength({ min: 1 }).escape(),

  // process request after validation and sanitization
  (req, res, next) => {
    const errors = validationResult(req);

    // create a genre object with escaped and trimmed data
    let genre = new Genre ({
      name: req.body.name,
    });

    if (!errors.isEmpty()) {
      genre.name = decode(genre.name);

      res.render('genre_form', 
        {
          title: 'Create Genre', 
          genre: genre, 
          errors: errors.array()
        }
      );
      return;
    }
    else {

      // check if Genre with same name already exists
      Genre.findOne({ name: req.body.name })
        .exec(function (err, found_genre) {
          if (err) return next(err);

          if (found_genre) {
            res.redirect(found_genre.url);
          }
          else {
            genre.save(function (err) {
              if (err) return next(err);

              res.redirect(genre.url);
            })
          }
        })
    }
  }
]

// display genre delete form on GET.
exports.genre_delete_get = function (req, res, next) {
  let genre = new Promise((resolve, reject) => {
    Genre.findById(req.params.id, (err, value) => {
      if (err) reject(err);
      else resolve(value);
    });
  });

  let genreBooks = new Promise((resolve, reject) => {
    Book.find({ genre: req.params.id }, (err, books) => {
      if (err) reject(err);
      else resolve(books);
    });
  });

  Promise.all([genre, genreBooks])
    .then((value) => {
      let [genre, genreBooks] = value;

      if (genre == null) res.redirect('/catalog/genres');

      // unescape encoded HTML entities so the user see them normally
      genre.name = decode(genre.name);
      genreBooks.forEach((book) => {
        book.title = decode(book.title);
        book.summary = decode(book.summary);
      });

      res.render('genre_delete', {
        title: 'Delete Genre',
        genre: genre,
        genreBooks: genreBooks,
      });
    })
    .catch(next);
};

// handle genre delete on POST.
exports.genre_delete_post = function (req, res, next) {
  let genre = new Promise((resolve, reject) => {
    Genre.findById(req.params.id, (err, value) => {
      if (err) reject(err);
      else resolve(value);
    });
  });

  let genreBooks = new Promise((resolve, reject) => {
    Book.find({ genre: req.params.id }, (err, books) => {
      if (err) reject(err);
      else resolve(books);
    });
  });

  Promise.all([genre, genreBooks])
    .then((value) => {
      let [genre, genreBooks] = value;

      if (genre === null) res.redirect('/catalog/genres');

      if (genreBooks.length > 0) {
        // unescape encoded HTML entities so the user see them normally
        genre.name = decode(genre.name);
        genreBooks.forEach((book) => {
          book.title = decode(book.title);
          book.summary = decode(book.summary);
        });
        
        res.render('genre_delete', {
          title: 'Genre Delete',
          genre: genre,
          genreBooks: genreBooks,
        });
      }
      else {
        Genre.findByIdAndDelete(req.body.genreId, (err) => {
          if (err) throw err;

          res.redirect('/catalog/genres');
        })
      }
    })
    .catch(next);
};

// display genre update form on GET.
exports.genre_update_get = function (req, res, next) {
  new Promise((resolve, reject) => {
    Genre.findById(req.params.id)
      .exec((err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
  })
    .then((genre) => {
      if (genre === null) {
        let error = new Error('Genre not found');
        error.status = 404;
        reject(error);
      }

      // unescape encoded HTML entities so the user see them normally
      genre.name = decode(genre.name);

      res.render('genre_form', {
        title: 'Update Genre',
        genre: genre,
      });
    })
    .catch(next);
};

// handle genre update on POST.
exports.genre_update_post = [
  body('name', 'Genre name required').trim().isLength({ min: 1 }).escape(),

  // process request after validation and sanitization
  (req, res, next) => {
    const errors = validationResult(req);
    let genre = new Genre({
      name: req.body.name,
      _id: req.params.id, // required, or else a new object will be created
    });

    if (!errors.isEmpty()) {
      // unescape encoded HTML entities so the user see them normally
      genre.name = decode(genre.name);
      
      res.render('genre_form', {
        title: 'Update Genre',
        genre: genre,
        errors: errors.array(),
      });
    }
    else {
      new Promise((resolve, reject) => {
        Genre.findByIdAndUpdate(req.params.id, genre, {}, (err, theGenre) => {
          if (err) reject(err);
          else resolve(theGenre);
        })
      })
        .then((result) => {
          res.redirect(result.url);
        })
        .catch(next);
    }
  }
];
