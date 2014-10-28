# Beast

An extensible wrapper that provides sensible methods on arrays.

## Chainable methods

`map`, `filter`, `reverse`, `slice`, `splice`, `sort`, `concat`, `append` , `prepend`, `tap`, `wait`, `mixins`

## .value([callback]*)

Returns the final value of the wrapped array.

*Is mostly desired when `wait` is in the stack.

```js
var foo = Beast([0, 1, 3, undefined, null, 16, 17])
	.filter(function (value) {
		return !!value;
	})
	.prepend(7, 8, 9)
	.append(10, 11, 12)
	.map(function (value) {
		return value * 3;
	})
	.value();
```

### See [.get()](#get)

## .wait(callback)

Waits for asynchronous actions. (provides `next` to continue down the stack.)

```js
Beast([0, 1, 3, 55, 74, 0])
	.filter(function (value) {
		return !!value;
	})
	.wait(function () {
		setTimeout(function () {
			this.set(Beast(this.get())
				.filter(function (value) {
					return value < 20;
				})
				.prepend(33, 33)
				.value());

			this.next();
		}.bind(this), 500);
	})
	.map(function (value) {
		return value * 2;
	})
	.value(function () {
		console.log(this.get());
	});
```

### .get()

Gets the current value of the wrapped array.

### .set()

Sets the value of the wrapped array.

### .next()

Executes the `next` layer in the stack.

## .tap(callback)

Taps into the current state of the stack.

```js
var foo = Beast([5, 6, 7, 8, 11])
	.map(function (value) {
		return value - 1;
	})
	.tap(function () {
		console.log(this.inspect());
	})
	.value();
```

### .inspect()

Inspects the current inner workings of the stack:

- The current `stack`.
- The current `index` of the stack.

### See [.get()](#get)

## .mixins({...})

Adds mixins for a plugin interface.

```js
var foo = Beast([10, 20, 30, 40])
	.mixins({
		take: function (howMany) {
			this.set(this.get()
				.splice(0, howMany));
		}
	})
	.filter(function (value) {
		return value > 10;
	})
	.take(2)
	.value();
```

### See [.get()](#get)

### See [.set()](#set)

## Error Handling

If an error occurs in the function body of `Beast`'s methods (that encapsulate synchronous code.), an error message will output to the Web Console, and in addition, the `next` method in the stack will be executed. 

## Tests

TODO.

## Versioning

Releases will be numbered using the following format:

```
<major>.<minor>.<patch>
```

And constructed with the following guidelines:

- Breaking backward compatibility **bumps the major** while resetting minor and patch.
- New additions without breaking backward compatibility **bumps the minor** while resetting the patch.
- Bug fixes and misc. changes **bumps only the patch**.

For more information on SemVer, please visit <http://semver.org/>.

## License

[MIT License](https://github.com/coopersemantics/beast/blob/master/MIT-LICENSE.txt).
