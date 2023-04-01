# babel comments

babel의 첫번째 커밋에서부터 코드를 분석하고 어떻게 구현되어있고 동작하는 원리를 알아봅시다.

## 폴더 구조
```
/root
  /lib
  	/6to5
  	  /templates
  	  /transformers
  	  /traverse
  	  /browserify.js
  	  /middleware.js
  	  /node.js
  	  /transform.js
  	  /util.js
  /package.json
```

## 파일 내용


### [./package.json](./package.json)
패키지의 내용을 정의합니다. 엔트리 파일이 `./lib/6to5/node.js`임을 알 수 있습니다.


### [./lib/6to5/templates](./lib/6to5/templates)



### [./lib/6to5/transformers](./lib/6to5/transformers)



### [./lib/6to5/traverse](./lib/6to5/traverse)



### [./lib/6to5/browserify.js](./lib/6to5/browserify.js)



### [./lib/6to5/middleware.js](./lib/6to5/middleware.js)



### [./lib/6to5/node.js](./lib/6to5/node.js)


### [./lib/6to5/transform.js](./lib/6to5/transform.js)


### [./lib/6to5/util.js](./lib/6to5/util.js)



아래는 원 repo의 readme 파일 내용입니다.

---
# 6to6

**6to5** turns ES6 code into vanilla ES5, so you can use ES6 features **today.**

6to5 is:

 - Fast - [10x faster than Traceur](#comparison-to-traceur).
 - Compact - maps directly to the equivalent ES5.
 - Easy - with Browserify support, Node API, Connect Middleware and a CLI.
 - Concise - we do not pollute any scope with unneccesary variables or functions declarations.

## Features

| Name                       | Implemented |
| -------------------------- | ----------- |
| Arrow functions            | ✓           |
| Classes                    | ✓           |
| Default parameters         | ✓           |
| Spread                     | ✓           |
| Block binding              | ✓           |
| Property method assignment | ✓           |
| Rest parameters            | ✓           |
| Template literals          | ✓           |
| Modules                    | ✓           |
| Destructuring assignment   |             |
| Generators                 |             |

## Installation

    $ npm install -g 6to5

## Usage

### CLI

Compile the file `script.js` and output it to `script-compiled.js`.

    $ 6to5 script.js -o script-compiled.js

Compile the entire `src` directory and output it to the `lib` directory.

    $ 6to5 src -d lib

Compile the file `script.js` and output it to stdout.

    $ 6to5 script.js

### Node

```javascript
var to5 = require("6to5");

to5.transform("code();");

to5.transformFileSync("script.js");

to5.transformFile("script.js", function (err, data) {

});
```

##### Options

```javascript
to5.transform("code();", {
  // List of transformers to EXCLUDE
  // See `features` for valid names.
  blacklist: [],

  // List of transformers to ONLY use.
  // See `features` for valid names.
  whitelist: [],

  // Append source map and comment to bottom of returned output.
  sourceMap: false,

  // Filename for use in errors etc.
  filename: "unknown",

  // Format options
  // See https://github.com/Constellation/escodegen/wiki/API for options.
  format: {}
});
```

#### Require hook

All subsequent files required by node will be transformed into ES5 compatible
code.

```javascript
require("6to5/register");
```

#### Connect Middleware

```javascript
var to5 = require("6to5");

app.use(6to5.middleware({
  transform: {
    // options to use when transforming files
  },
  src: "assets",
  dest: "cache"
}));

app.use(connect.static("cache"));
```

### Browserify

#### CLI

    $ browserify script.js -t 6to5/browserify --outfile bundle.js

#### Node

```javascript
var to5 = require("6to5");
browserify()
  .transform(to5.browserify)
  .require("script.js", { entry: true })
  .bundle({ debug: true })
  .pipe(fs.createWriteStream("bundle.js"));
```

## Caveats

### Generators

### Let

## Comparison to Traceur
