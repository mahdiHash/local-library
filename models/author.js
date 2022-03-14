const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const { DateTime } = require('luxon');
let AuthorSchema = new Schema({
  first_name: { type: String, required: true, maxLength: 100 },
  family_name: { type: String, required: true, maxLength: 100 },
  date_of_birth: { type: Date },
  date_of_death: { type: Date },
});

// virtual for author's full name
AuthorSchema.virtual('name').get(function () {
  if (!(this.first_name || this.family_name)) {
    return 'Unknown';
  }
  
  return this.first_name + ' ' + this.family_name;
});

// virtual for formatted author's lifespan
AuthorSchema.virtual('lifespan_formatted').get(function () {
  let birth = this.date_of_birth
    ? DateTime.fromJSDate(this.date_of_birth).toLocaleString(DateTime.DATE_MED)
    : 'Unknown';
  let death = this.date_of_death
    ? DateTime.fromJSDate(this.date_of_death).toLocaleString(DateTime.DATE_MED)
    : 'Unknown';
    
  return `${birth} - ${death}`;
});

// date of birth in the format of HTML date input: YYYY-MM-DD
// this will be used in update form
AuthorSchema.virtual('DoB_form_value').get(function () {
  if (this.date_of_birth === null) {
    return '';
  }

  let year = new Date(this.date_of_birth).getFullYear();
  let month = new Date(this.date_of_birth).getMonth() + 1;
  let day = new Date(this.date_of_birth).getDate();

  month = month.toString().length == 1 ? '0' + month : month;
  day = day.toString().length == 1 ? '0' + day : day;

  return `${year}-${month}-${day}`;
});

// date of death in the format of HTML date input: YYYY-MM-DD
// this will be used in update form
AuthorSchema.virtual('DoD_form_value').get(function () {
  if (this.date_of_death === null) {
    return '';
  }
  
  let year = new Date(this.date_of_death).getFullYear();
  let month = new Date(this.date_of_death).getMonth() + 1;
  let day = new Date(this.date_of_death).getDate();

  month = month.toString().length == 1 ? '0' + month : month;
  day = day.toString().length == 1 ? '0' + day : day;

  return `${year}-${month}-${day}`;
});

// virtual for author's URL
AuthorSchema.virtual('url').get(function () {
  return '/catalog/author/' + this._id;
});

module.exports = mongoose.model('Author', AuthorSchema);
