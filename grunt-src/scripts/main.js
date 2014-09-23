bookstore.Application = function() {
	function init() {
		routes(location.pathname, false);
		$(window).on("popstate", function(event) {
			var path = event.originalEvent.state || "/";
			routes(path);
		});
	}
	function routes(path, push) {
		switch(path) {
			case "/":
				index();
				break;
			case "/books":
				books();
				break;
			case "/shops":
				shops();
				break;
			case "/books/with_quantity":
				booksWithQuantity();
				break;
			default:
				if (path.indexOf("/shops/") === 0) {
					shopDetail(path.substring("/shops/".length));
					break;
				}
				error(path);
		}
		if (push) {
			pushState(path);
		}
	}
	function pushState(path) {
		if (history.pushState) {
			history.pushState(path, null, path);
		}
	}
	function breadcrumb() {
		$("#breadcrumb-home").click(function() {
			routes("/", true);
			return false;
		});
		$("#breadcrumb-shops").click(function() {
			routes("/shops", true);
			return false;
		});
	}
	function ajax(params) {
		$.ajax(params);
	}
	function loadTemplate(name, successFunc) {
		ajax({
			"url" : "/templates/" + name,
			"success" : successFunc
		});
	}
	function index() {
		templateManager.load($container, "index", function() {
			$("#index-books").click(function() {
				routes("/books", true);
				return false;
			});
			$("#index-shops").click(function() {
				routes("/shops", true);
				return false;
			});
			$("#index-books-with-quantity").click(function() {
				routes("/books/with_quantity", true);
				return false;
			});
		});
	}
	function books() {
		ajax({
			"url" : "/books",
			"type" : "POST",
			"success" : function(data) {
				templateManager.load($container, "books", function() {
					breadcrumb();
					ko.applyBindings({
						"books" : data
					}, $("#books-tbody")[0]);
				});
			}
		});
	}
	function shops() {
		ajax({
			"url" : "/shops",
			"type" : "POST",
			"success" : function(data) {
				templateManager.load($container, "shops", function() {
					var $ul = $("#shops-list");
					breadcrumb();
					ko.applyBindings({
						"shops" : data
					}, $ul[0]);
					$ul.find("a").click(function() {
						var id = $(this).attr("data-id");
						routes("/shops/" + id, true);
						return false;
					});
				});
			}
		});
	}
	function shopDetail(shopId) {
		ajax({
			"url" : "/shops/" + shopId,
			"type" : "POST",
			"success" : function(data) {
				templateManager.load($container, "shopDetail", function() {
					breadcrumb();
					$("#shop-name").text(data.shop.name);
					ko.applyBindings(data, $("#shop-books-tbody")[0]);
				});
			}
		});
	}
	function booksWithQuantity() {
		ajax({
			"url" : "/books/with_quantity",
			"type" : "POST",
			"success" : function(data) {
				templateManager.load($container, "booksWithQuantity", function() {
					breadcrumb();
					ko.applyBindings({
						"books" : data
					}, $("#books-tbody")[0]);
				});
			}
		});
	}
	function error(path) {
		$container.text("Not found: " + path);
	}
	var cache = new room.Cache(sessionStorage),
		templateManager = new room.TemplateManager(cache, loadTemplate),
		$container = $("#container");

	cache.clear();
	templateManager.save("index", $container.html());
	init();
};
