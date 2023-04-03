var util = require("./util");
var path = require("path");
var api  = require("./node");
var fs   = require("fs");
var _    = require("lodash");

module.exports = function (opts) {
  opts = _.defaults(opts || {}, {
    src: "assets",
    dest: "cache"
  });
  
  /**
   * 캐시 초기화
   */
  var cache = {};

  /**
   * 미들웨어 함수 반환
   */
  return function (req, res, next) {
    /**
     * 요청 주소 (파일주소)
     */
    var url = req.url;
    /**
     * 지원하지 않으면 다음 미들웨어로 던
     */
    if (!util.canCompile(url)) return next();

    /**
     * 옵션 값을 이용하여 파일 경로 계산
     */
    var dest = path.join(opts.dest, url);
    var src  = path.join(opts.src, url);

    /**
     * dest 경로에 변환된 파일 저장
     * @param {*} transformed 
     */
    var write = function (transformed) {
      fs.writeFile(dest, transformed, function (err) {
        if (err) {
          next(err);
        } else {
          /**
           * 성공하면 캐시를 업데이트하고 다음 미들웨어 실행
           */
          cache[url] = Date.now();
          next();
        }
      });
    };

    /**
     * 컴파일 함수 정의
     */
    var compile = function () {
      var transformOpts = _.clone(opts.transform || {});

      /**
       * ./node.js파일에서 export된 함수 실행
       * 코드 변환 후 dest에 파일 작성  
       */
      api.transformFile(opts.dest, transformOpts, function (err, transformed) {
        if (err) return next(err);
        write(transformed);
      });
    };

    /**
     * dest 파일이 존재할 때
     * 호출되는 함수
     */
    var destExists = function () {
      fs.stat(dest, function (err, stat) {
        if (err) return next(err);

        /**
         * 캐시타임을 확인해서 컴파일여부 결정
         */
        if (cache[url] < +stat.mtime) {
          compile();
        } else {
          next();
        }
      });
    };

    /**
     * 여기서 메인 로직 실행
     * 
     * 소스 파일이 존재한다면
     */
    fs.exists(src, function (exists) {
      if (!exists) return next();

      fs.exists(dest, function (exists) {
        /**
         * dest 파일이 존재하고 캐시가 존재한다면
         * 함수 호출
         */
        if (exists && cache[dest]) {
          destExists();
        } else {
          /**
           * 파일이 없다면 바로 컴파
           */
          compile();
        }
      });
    });
  };
};
