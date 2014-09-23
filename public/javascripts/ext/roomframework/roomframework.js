if (typeof(room) === "undefined") room = {};
if (typeof(room.utils) === "undefined") room.utils = {};

$(function() {
	"use strict";
	var visibilityPrefix = (function() {
		var key = "hidden",
			prefix = ["webkit", "moz", "ms"];
		if (key in document) {
			return "";
		}
		key = "Hidden";
		for (var i=0; i<prefix.length; i++) {
			if (prefix + key in document) {
				return prefix;
			}
		}
		return "";
	})(),
	visibilityProp = visibilityPrefix ? visibilityPrefix + "Hidden" : "hidden",
	visibilityChangeProp = visibilityPrefix + "visibilitychange",
	nullLogger = {
		"log" : function() {}
	}, 
	defaultSettings = {
		"maxRetry" : 5,
		"authCommand" : "room.auth",
		"authError" : null,
		"retryInterval" : 1000,
		"noopCommand" : "noop",
		"logger" : nullLogger
	};
	if (isIOS()) {
		visibilityChangeProp = "pageshow";
	}
	function isDocumentVisible() {
		return !document[visibilityProp];
	}
	function isMobile() {
		return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
	}
	function isIOS() {
		return /iPhone|iPad|iPod/i.test(navigator.userAgent);
	}

	/**
	 * settings
	 * - url
	 * - maxRetry
	 * - retryInterval
	 * - logger
	 * - authToken
	 * - onOpen(event)
	 * - onClose(event)
	 * - onMessage(event)
	 * - onSocketError(event)
	 * - onRequest(command, data)
	 * - onServerError(data)
	 */
	room.Connection = function(settings) {
		function request(params) {
			logger.log("request", params);
			if (!isConnected()) {
				if (openning || retryCount < settings.maxRetry) {
					ready(function() {
						request(params);
					});
					if (!openning) {
						socket = createWebSocket();
					}
				}
				return;
			}
			if (settings.onRequest) {
				settings.onRequest(params.command, params.data);
			}
			var startTime = new Date().getTime(),
				id = ++requestId;
			times[id] = startTime;
			if (params.success) {
				listeners[id] = params.success;
			}
			if (params.error) {
				errors[id] = params.error;
			}
			var msg = {
				"id" : id,
				"command" : params.command,
				"data" : params.data
			};
			if (params.log) {
				msg.log = params.log;
			}
			socket.send(JSON.stringify(msg));
			return self;
		}
		function on(name, sl, el) {
			if (sl) {
				listeners[name] = sl;
			}
			if (el) {
				errors[name] = el;
			}
			return self;
		}
		function off(name) {
			delete listeners[name];
			delete errors[name];
			return self;
		}
		function onOpen(event) {
			function authError(data) {
				logger.log("authError", settings.url);
				retryCount = settings.maxRetry;
				if (settings.authError) {
					settings.authError(data);
				}
			}
			openning = false;
			logger.log("onOpen", settings.url);
			if (settings.onOpen) {
				settings.onOpen(event);
			}
			retryCount = 0;
			if (settings.authToken) {
				request({
					"command" : settings.authCommand,
					"data" : settings.authToken,
					"success" : function(data) {
						settings.authToken = data;
					},
					"error" : authError
				});
			}
			for (var i=0; i<readyFuncs.length; i++) {
				readyFuncs[i]();
			}
			readyFuncs = [];
		}
		function onMessage(event) {
			logger.log("receive", event.data);
			if (settings.onMessage) {
				settings.onMessage(event);
			}
			var data = JSON.parse(event.data),
				startTime = times[data.id],
				func = null;
			if (startTime) {
				delete times[data.id];
			}
			if (data.type == "error") {
				if (data.id && errors[data.id]) {
					func = errors[data.id];
				} else if (data.command && errors[data.command]) {
					func = errors[data.command];
				} else if (settings.onServerError) {
					func = settings.onServerError;
				}
			} else {
				if (data.id && listeners[data.id]) {
					func = listeners[data.id];
				} else if (data.command && listeners[data.command]) {
					func = listeners[data.command];
				}
			}
			if (data.id) {
				delete listeners[data.id];
				delete errors[data.id];
			}
			if (func) {
				func(data.data);
			} else if (data.type != "error") {
				logger.log("UnknownMessage", event.data);
			}
		}
		function onClose(event) {
			function isRetry() {
				if (isMobile() && !isDocumentVisible()) {
					return false;
				}
				return retryCount < settings.maxRetry;
			}
			logger.log("close", settings.url);
			if (settings.onClose) {
				settings.onClose(event);
			}
			if (isRetry()) {
				setTimeout(function() {
					if (!isConnected()) {
						socket = createWebSocket();
					}
				}, retryCount * settings.retryInterval);
				retryCount++;
			} else if (sendNoopHandle) {
				clearInterval(sendNoopHandle);
				sendNoopHandle = 0;
			}
		}
		function onError(event) {
			if (settings.onSocketError) {
				settings.onSocketError(event);
			}
		}
		function polling(interval, params) {
			return setInterval(function() {
				if (isConnected()) {
					request($.extend(true, {}, params));
				}
			}, interval);
		}
		function ready(func) {
			if (isConnected()) {
				func();
			} else {
				readyFuncs.push(func);
			}
		}
		function close() {
			if (isConnected()) {
				retryCount = settings.maxRetry;
				socket.close();
			}
		}
		function isConnected() {
			return socket.readyState == 1;//OPEN
		}
		function createWebSocket() {
			openning = true;
			var socket = new WebSocket(settings.url);
			socket.onopen = onOpen;
			socket.onmessage = onMessage;
			socket.onerror = onError;
			socket.onclose = onClose;
			return socket;
		}
		function sendNoop(interval, sendIfHidden, commandName) {
			if (sendNoopHandle) {
				clearInterval(sendNoopHandle);
			}
			sendNoopHandle = setInterval(function() {
				if (isConnected() && (sendIfHidden || isDocumentVisible())) {
					request({
						"command" : commandName || "noop"
					});
				}
			}, interval * 1000);
			return sendNoopHandle;
		}
		if (typeof(settings) === "string") {
			settings = {
				"url" : settings
			};
		}
		settings = $.extend({}, defaultSettings, settings);
		var self = this,
			logger = settings.logger,
			requestId = 0,
			times = {},
			listeners = {},
			errors = {},
			readyFuncs = [],
			openning = false,
			retryCount = 0,
			sendNoopHandle = 0,
			socket = createWebSocket();
		$(window).on("beforeunload", close);
		$(document).on(visibilityChangeProp, function() {
			var bVisible = isDocumentVisible();
			logger.log(visibilityChangeProp, "visible=" + bVisible);
			if (bVisible && !isConnected()) {
				socket = createWebSocket();
			}
		});
		if (settings.noopCommand) {
			on(settings.noopCommand, function() {});
		}
		$.extend(this, {
			"request" : request,
			/** deprecated use on method.*/
			"addEventListener" : on,
			/** deprecated use off method.*/
			"removeEventListener" : off,
			"on" : on,
			"off" : off,
			"polling" : polling,
			"ready" : ready,
			"close" : close,
			"isConnected" : isConnected,
			"sendNoop" : sendNoop,
			"onOpen" : function(func) { settings.onOpen = func; return this;},
			"onClose" : function(func) { settings.onClose = func; return this;},
			"onRequest" : function(func) { settings.onRequest = func; return this;},
			"onMessage" : function(func) { settings.onMessage = func; return this;},
			"onSocketError" : function(func) { settings.onSocketError = func; return this;},
			"onServerError" : function(func) { settings.onServerError = func; return this;}
		});
	};
	$.extend(room.utils, {
		"isIOS" : isIOS,
		"isMobile" : isMobile,
		"isDocumentVisible" : isDocumentVisible
	});
});
if (typeof(room) === "undefined") room = {};

$(function() {
	room.Cache = function(storage, logErrors) {
		function get(key) {
			if (storage) {
				try {
					return storage.getItem(key);
				} catch (e) {
					//Ignore. Happened when cookie is disabled. 
					if (logErrors && console) {
						console.log(e);
					}
				}
			}
			return null;
		}
		function getAsJson(key) {
			var ret = get(key);
			if (ret) {
				ret = JSON.parse(ret);
			}
			return ret;
		}
		function put(key, value) {
			if (storage) {
				if (typeof(value) === "object") {
					value = JSON.stringify(value);
				}
				try {
					storage.setItem(key, value);
				} catch (e) {
					//Ignore. Happened when cookie is disabled, or quota exceeded.
					if (logErrors && console) {
						console.log(e);
					}
				}
			}
		}
		function remove(key) {
			if (storage) {
				try {
					storage.removeItem(key);
				} catch (e) {
					//Ignore. Happened when cookie is disabled, or quota exceeded.
					if (logErrors && console) {
						console.log(e);
					}
				}
			}
		}
		function keys() {
			var ret = [];
			if (storage) {
				try {
					for (var i=0; i<storage.length; i++) {
						ret.push(storage.key(i));
					}
				} catch (e) {
					//Ignore. Happened when cookie is disabled. 
					if (logErrors && console) {
						console.log(e);
					}
				}
			}
			return ret;
		}
		function size() {
			try {
				return sotrage ? storage.length : 0;
			} catch (e) {
				if (logErrors && console) {
					console.log(e);
				}
			}
		}
		function clear() {
			if (storage) {
				try {
					storage.clear();
				} catch (e) {
					//Ignore. Happened when cookie is disabled. 
					if (logErrors && console) {
						console.log(e);
					}
				}
			}
		}
		$.extend(this, {
			"get" : get,
			"getAsJson" : getAsJson,
			"put" : put,
			"remove" : remove,
			"size" : size,
			"clear" : clear,
			"keys" : keys
		});
	};
});
if (typeof(room) === "undefined") room = {};

$(function() {
	if (!room.Cache) {
		return;
	}
	room.TemplateManager = function(cache, loadFunc) {
		function load($el, name, callback) {
			function doLoad(html) {
				$el.html(html).show();
				if (callback) {
					callback(html);
				}
			}
			var html = cache.get("template." + name);
			if (html) {
				doLoad(html);
				return;
			}
			loadFunc(name, function(data) {
				save(name, data);
				doLoad(data);
			});
		}
		function save(name, html) {
			cache.put("template." + name, html);
		}
		$.extend(this, {
			"load" : load,
			"save" : save
		});
	};
});

if (typeof(room) === "undefined") room = {};
if (typeof(room.logger) === "undefined") room.logger = {};
if (typeof(room.utils) === "undefined") room.utils = {};

$(function() {
	function stripFunc(obj) {
		var type = typeof(obj);
		if (type !== "object") {
			return obj;
		} else if ($.isArray(obj)) {
			var newArray = [];
			for (var i=0; i<obj.length; i++) {
				type = typeof(obj[i]);
				if (type === "function") {
					newArray.push("(function)");
				} else if (type === "object") {
					newArray.push(stripFunc(obj[i]));
				} else {
					newArray.push(obj[i]);
				}
			}
			return newArray;
		} else {
			var newObj = {};
			for (var key in obj) {
				type = typeof(key);
				if (type === "function") {
					newObj[key] = "(function)";
				} else if (type === "object") {
					newObj[key] = stripFunc(obj[key]);
				} else {
					newObj[key] = obj[key];
				}
			}
			return newObj;
		}
	}
	room.logger.WsLogger = function(wsUrl, commandName) {
		var ws = new room.Connection(wsUrl);
		commandName = commandName || "log";
		this.log = function() {
			ws.request({
				"command": commandName,
				"data": stripFunc(arguments)
			});
		};
	};
	room.logger.DivLogger = function($div) {
		this.log = function() {
			var msgs = [];
			for (var i=0; i<arguments.length; i++) {
				if (typeof(arguments[i]) == "object") {
					msgs.push(stripFunc(arguments[i]));
				} else {
					msgs.push(arguments[i]);
				}
			}
			$("<p/>").text(JSON.stringify(msgs)).prependTo($div);
		};
	};
	room.logger.nullLogger = {
		"log" : function() {}
	};
	$.extend(room.utils, {
		"stripFunc" : stripFunc
	});
});