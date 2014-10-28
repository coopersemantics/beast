(function (global) {
	"use strict";

	/*jshint loopfunc: true */

	var TYPE_FUNCTION = "[object Function]";
	var PREFIX_PROPERTY = "_";

	var ArrayProto = Array.prototype;
	var ObjectProto = Object.prototype;

	var isType = function (context, type) {
		return type === ObjectProto.toString.call(context);
	};

	var toArray = function (object) {
		return ArrayProto.slice.call(object);
	};

	/**
	 * @class
	 * @param {array} object
	 * @returns {object}
	 * @public
	 */

	var Beast = function (object) {
		if (object instanceof Beast) {
			return object;
		}

		if (!(this instanceof Beast)) {
			return new Beast(object);
		}

		this._wrapped = object;
		this._stack = [];
		this._stackIndex = 0;
	};

	[
		"map", "filter", "reverse",
		"slice", "splice", "sort",
		"concat"
	].forEach(function (property) {
		Beast.prototype[PREFIX_PROPERTY + property] = function (args) {
			var that = this;
			var wrapped = that.get();

			that._wrapped = wrapped[property].apply(wrapped, args);
		};

		Beast.prototype[property] = function () {
			var that = this;
			var args = toArray(arguments);

			that._stackManager(that[PREFIX_PROPERTY + property].bind(that, args));

			return that;
		};
	});

	/**
	 * Enqueues layers in the stack.
	 * @Note Enqueued layers in the stack are executed serially.
	 * @param {function} layer
	 * @returns {number}
	 * @public
	 */

	Beast.prototype.enqueue = function (layer) {
		return this._stack.push(layer);
	};

	/**
	 * Manages the enqueued layers in the stack.
	 * @param {function} layer
	 * @param {boolean|void} isWaiting
	 * @returns {void}
	 * @private
	 */

	Beast.prototype._stackManager = function (layer, isWaiting) {
		var that = this;

		that.enqueue(function () {
			layer();

			if (!isWaiting) {
				return that.next();
			}
		});
	};

	["append", "prepend"].forEach(function (property) {
		Beast.prototype[property] = function () {
			var that = this;
			var args = toArray(arguments);

			that._stackManager(function () {
				that[PREFIX_PROPERTY + property].apply(that, args);
			});

			return that;
		};
	});

	/**
	 * Mutates the `_wrapped` array, by appending new values.
	 * @param {*} arguments
	 * @returns {number}
	 * @private
	 */

	Beast.prototype._append = function () {
		var that = this;

		return ArrayProto.push.apply(that.get(), arguments);
	};

	/**
	 * Mutates the `_wrapped` array, by prepending new values.
	 * @param {*} arguments
	 * @returns {number}
	 * @private
	 */

	Beast.prototype._prepend = function () {
		var that = this;

		return ArrayProto.unshift.apply(that.get(), arguments);
	};

	/**
	 * Gets the current value of the `_wrapped` array.
	 * @returns {array}
	 * @public
	 */

	Beast.prototype.get = function () {
		return this._wrapped;
	};

	/**
	 * Sets the value of the `_wrapped` array.
	 * @param {array} value
	 * @returns {void}
	 * @public
	 */

	Beast.prototype.set = function (value) {
		var that = this;

		that._wrapped = Array.isArray(value) && value || that.get();
	};

	/**
	 * Executes the `next` layer in the stack.
	 * @returns {void}
	 * @public
	 */

	Beast.prototype.next = function () {
		var that = this;
		var layer = that._stack[that._stackIndex++];

		try {
			if (isType(layer, TYPE_FUNCTION)) {
				layer();
			}
		} catch (err) {
			err.message += " [Stack Index: " + that._stackIndex + "]";

			console.error(err);

			return that.next();
		}
	};

	/**
	 * Adds mixins for a plugin interface.
	 * @param {object} mixins
	 * @returns {object}
	 * @public
	 */

	Beast.prototype.mixins = function (mixins) {
		var that = this;
		var property;

		for (property in mixins) {
			if (ObjectProto.hasOwnProperty.call(mixins, property)) {
				Beast.prototype[PREFIX_PROPERTY + property] = mixins[property].bind({
					get: that.get.bind(that),
					set: that.set.bind(that)
				});

				Beast.prototype[property] = (function (property) {
					return function () {
						var that = this;
						var args = toArray(arguments);

						that._stackManager(function () {
							that[PREFIX_PROPERTY + property].apply(that, args);
						});

						return that;
					};
				})(property);
			}
		}

		return that;
	};

	/**
	 * Waits for asynchronous actions. (provides `next` to continue down the stack.)
	 * @param {function} callback
	 * @returns {object}
	 * @public
	 */

	Beast.prototype.wait = function (callback) {
		var that = this;

		that._stackManager(function () {
			callback.call({
				get: that.get.bind(that),
				set: that.set.bind(that),
				next: that.next.bind(that)
			});
		}, true);

		return that;
	};

	/**
	 * Taps into the current state of the stack.
	 * @param {function} callback
	 * @returns {object}
	 * @public
	 */

	Beast.prototype.tap = function (callback) {
		var that = this;

		that._stackManager(function () {
			callback.call({
				get: that.get.bind(that),
				inspect: function () {
					return {
						stack: that._stack,
						index: that._stackIndex
					};
				}
			});
		});

		return that;
	};

	/**
	 * Returns the final value of the wrapped array.
	 * @param {function} callback
	 * @returns {array}
	 * @public
	 */

	Beast.prototype.value = function (callback) {
		var that = this;

		if (isType(callback, TYPE_FUNCTION)) {
			that._stackManager(function () {
				callback.call({
					get: that.get.bind(that)
				});
			});
		}

		that.next();

		return that.get();
	};

	/**
	 * Exposes `Beast` on the global object.
	 * @public
	 */

	global.Beast = Beast;
})(this);
