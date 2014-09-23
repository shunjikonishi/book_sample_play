var assert = chai.assert;

describe('Book test', function() {
	var id_of_shinjuku_nishiguchi;
	before(function(done) {
		$.ajax({
			"url" : "/shops",
			"type" : "POST",
			"success" : function(data) {
				id_of_shinjuku_nishiguchi =  data[0].id;
				assert(id_of_shinjuku_nishiguchi > 0);
				done();
			}
		});
	});
	describe("books method", function() {
		var books;
		before(function(done) {
			$.ajax({
				"url" : "/books",
				"type" : "POST",
				"success" : function(data) {
					books = data;
					done();
				}
			});
		});
		it("The number of records must be 6", function() {
			assert.equal(books.length, 6);
		});
		it("Ordered by author name", function() {
			var prev = "";
			$.each(books, function(idx, book) {
				assert(book.author.name >= prev);
				prev = book.author.name;
			});
		});
	});
	describe("shopDetail method", function() {
		var books;
		before(function(done) {
			$.ajax({
				"url" : "/shops/" + id_of_shinjuku_nishiguchi,
				"type" : "POST",
				"success" : function(data) {
					books = data.books;
					done();
				}
			});
		});
		it("The number of records must be 4", function() {
			assert.equal(books.length, 4);
		});
		it("There are 3 books which title is 'The Mist'", function() {
			var book = books.filter(function(book) {
				return book.name == "The Mist";
			});
			assert.equal(book.length, 1);
			assert.equal(book[0].quantity, 3);
		});
	});
	describe("withQuantity method", function() {
		var books;
		before(function(done) {
			$.ajax({
				"url" : "/books/with_quantity",
				"type" : "POST",
				"success" : function(data) {
					books = data;
					done();
				}
			});
		});
		it("The number of records must be 6", function() {
			assert.equal(books.length, 6);
		});
		it("Correct quantity", function() {
			var mist = books.filter(function(book) {
				return book.name == "The Mist";
			}),
			noStock = books.filter(function(book) {
				return book.quantity == 0;
			});
			assert.equal(mist.length, 1);
			assert.equal(mist[0].quantity, 5);

			assert.equal(noStock.length, 1);
			assert.equal(noStock[0].name, "Programming Ruby");
		});
		it("Ordered by quantity", function() {
			var prev = 999;
			$.each(books, function(idx, book) {
				assert(book.quantity <= prev);
				prev = book.quantity;
			});
		});
	});
});
