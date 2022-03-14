const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const { DateTime } = require('luxon');
let BookInstanceSchema = new Schema({
  book: { type: Schema.Types.ObjectId, ref: 'Book', required: true },
  imprint: { type: String, required: true },
  status: {
    type: String,
    required: true,
    enum: ['Available', 'Maintenance', 'Loaned', 'Reserved'],
    default: 'Maintenance',
  },
  due_back: { type: Date, default: Date.now },
});

// virtual for bookinstance's URL
BookInstanceSchema.virtual('url').get(function () {
  return '/catalog/bookinstance/' + this._id;
});

BookInstanceSchema.virtual('due_back_form_value').get(function () {
  let year = new Date(this.due_back).getFullYear();
  let month = new Date(this.due_back).getMonth() + 1;
  let day = new Date(this.due_back).getDate();

  month = month.toString().length == 1 ? '0' + month : month;
  day = day.toString().length == 1 ? '0' + day : day;

  return `${year}-${month}-${day}`;
});

// virtual for formatted bookisntance's due back date
BookInstanceSchema.virtual('due_back_formatted').get(function () {
  return DateTime.fromJSDate(this.due_back).toLocaleString(DateTime.DATE_MED);
});

module.exports = mongoose.model('BookInstance', BookInstanceSchema);
