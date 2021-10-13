const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const itemSchema = new Schema({
	name: {
		type: String,
		required: true,
	},
	category: {
		type: String,
		required: true,
	},
	store: {
		type: String,
		required: true,
	},
	latitude: {
		type: Number,
		required: true,
	},
	longitude: {
		type: Number,
		required: true,
	},
});

const Item = mongoose.model('Item', itemSchema);
module.exports = Item;
