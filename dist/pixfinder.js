"use strict";
var pix = (() => {
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __commonJS = (cb, mod) => function __require() {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  };

  // node_modules/quickselect/quickselect.js
  var require_quickselect = __commonJS({
    "node_modules/quickselect/quickselect.js"(exports, module) {
      (function(global, factory) {
        typeof exports === "object" && typeof module !== "undefined" ? module.exports = factory() : typeof define === "function" && define.amd ? define(factory) : global.quickselect = factory();
      })(exports, function() {
        "use strict";
        function quickselect(arr, k, left, right, compare) {
          quickselectStep(arr, k, left || 0, right || arr.length - 1, compare || defaultCompare);
        }
        function quickselectStep(arr, k, left, right, compare) {
          while (right > left) {
            if (right - left > 600) {
              var n = right - left + 1;
              var m = k - left + 1;
              var z = Math.log(n);
              var s = 0.5 * Math.exp(2 * z / 3);
              var sd = 0.5 * Math.sqrt(z * s * (n - s) / n) * (m - n / 2 < 0 ? -1 : 1);
              var newLeft = Math.max(left, Math.floor(k - m * s / n + sd));
              var newRight = Math.min(right, Math.floor(k + (n - m) * s / n + sd));
              quickselectStep(arr, k, newLeft, newRight, compare);
            }
            var t = arr[k];
            var i = left;
            var j = right;
            swap(arr, left, k);
            if (compare(arr[right], t) > 0) swap(arr, left, right);
            while (i < j) {
              swap(arr, i, j);
              i++;
              j--;
              while (compare(arr[i], t) < 0) i++;
              while (compare(arr[j], t) > 0) j--;
            }
            if (compare(arr[left], t) === 0) swap(arr, left, j);
            else {
              j++;
              swap(arr, j, right);
            }
            if (j <= k) left = j + 1;
            if (k <= j) right = j - 1;
          }
        }
        function swap(arr, i, j) {
          var tmp = arr[i];
          arr[i] = arr[j];
          arr[j] = tmp;
        }
        function defaultCompare(a, b) {
          return a < b ? -1 : a > b ? 1 : 0;
        }
        return quickselect;
      });
    }
  });

  // node_modules/rbush/index.js
  var require_rbush = __commonJS({
    "node_modules/rbush/index.js"(exports, module) {
      "use strict";
      module.exports = rbush;
      module.exports.default = rbush;
      var quickselect = require_quickselect();
      function rbush(maxEntries, format) {
        if (!(this instanceof rbush)) return new rbush(maxEntries, format);
        this._maxEntries = Math.max(4, maxEntries || 9);
        this._minEntries = Math.max(2, Math.ceil(this._maxEntries * 0.4));
        if (format) {
          this._initFormat(format);
        }
        this.clear();
      }
      rbush.prototype = {
        all: function() {
          return this._all(this.data, []);
        },
        search: function(bbox) {
          var node = this.data, result = [], toBBox = this.toBBox;
          if (!intersects(bbox, node)) return result;
          var nodesToSearch = [], i, len, child, childBBox;
          while (node) {
            for (i = 0, len = node.children.length; i < len; i++) {
              child = node.children[i];
              childBBox = node.leaf ? toBBox(child) : child;
              if (intersects(bbox, childBBox)) {
                if (node.leaf) result.push(child);
                else if (contains(bbox, childBBox)) this._all(child, result);
                else nodesToSearch.push(child);
              }
            }
            node = nodesToSearch.pop();
          }
          return result;
        },
        collides: function(bbox) {
          var node = this.data, toBBox = this.toBBox;
          if (!intersects(bbox, node)) return false;
          var nodesToSearch = [], i, len, child, childBBox;
          while (node) {
            for (i = 0, len = node.children.length; i < len; i++) {
              child = node.children[i];
              childBBox = node.leaf ? toBBox(child) : child;
              if (intersects(bbox, childBBox)) {
                if (node.leaf || contains(bbox, childBBox)) return true;
                nodesToSearch.push(child);
              }
            }
            node = nodesToSearch.pop();
          }
          return false;
        },
        load: function(data) {
          if (!(data && data.length)) return this;
          if (data.length < this._minEntries) {
            for (var i = 0, len = data.length; i < len; i++) {
              this.insert(data[i]);
            }
            return this;
          }
          var node = this._build(data.slice(), 0, data.length - 1, 0);
          if (!this.data.children.length) {
            this.data = node;
          } else if (this.data.height === node.height) {
            this._splitRoot(this.data, node);
          } else {
            if (this.data.height < node.height) {
              var tmpNode = this.data;
              this.data = node;
              node = tmpNode;
            }
            this._insert(node, this.data.height - node.height - 1, true);
          }
          return this;
        },
        insert: function(item) {
          if (item) this._insert(item, this.data.height - 1);
          return this;
        },
        clear: function() {
          this.data = createNode([]);
          return this;
        },
        remove: function(item, equalsFn) {
          if (!item) return this;
          var node = this.data, bbox = this.toBBox(item), path = [], indexes = [], i, parent, index, goingUp;
          while (node || path.length) {
            if (!node) {
              node = path.pop();
              parent = path[path.length - 1];
              i = indexes.pop();
              goingUp = true;
            }
            if (node.leaf) {
              index = findItem(item, node.children, equalsFn);
              if (index !== -1) {
                node.children.splice(index, 1);
                path.push(node);
                this._condense(path);
                return this;
              }
            }
            if (!goingUp && !node.leaf && contains(node, bbox)) {
              path.push(node);
              indexes.push(i);
              i = 0;
              parent = node;
              node = node.children[0];
            } else if (parent) {
              i++;
              node = parent.children[i];
              goingUp = false;
            } else node = null;
          }
          return this;
        },
        toBBox: function(item) {
          return item;
        },
        compareMinX: compareNodeMinX,
        compareMinY: compareNodeMinY,
        toJSON: function() {
          return this.data;
        },
        fromJSON: function(data) {
          this.data = data;
          return this;
        },
        _all: function(node, result) {
          var nodesToSearch = [];
          while (node) {
            if (node.leaf) result.push.apply(result, node.children);
            else nodesToSearch.push.apply(nodesToSearch, node.children);
            node = nodesToSearch.pop();
          }
          return result;
        },
        _build: function(items, left, right, height) {
          var N = right - left + 1, M = this._maxEntries, node;
          if (N <= M) {
            node = createNode(items.slice(left, right + 1));
            calcBBox(node, this.toBBox);
            return node;
          }
          if (!height) {
            height = Math.ceil(Math.log(N) / Math.log(M));
            M = Math.ceil(N / Math.pow(M, height - 1));
          }
          node = createNode([]);
          node.leaf = false;
          node.height = height;
          var N2 = Math.ceil(N / M), N1 = N2 * Math.ceil(Math.sqrt(M)), i, j, right2, right3;
          multiSelect(items, left, right, N1, this.compareMinX);
          for (i = left; i <= right; i += N1) {
            right2 = Math.min(i + N1 - 1, right);
            multiSelect(items, i, right2, N2, this.compareMinY);
            for (j = i; j <= right2; j += N2) {
              right3 = Math.min(j + N2 - 1, right2);
              node.children.push(this._build(items, j, right3, height - 1));
            }
          }
          calcBBox(node, this.toBBox);
          return node;
        },
        _chooseSubtree: function(bbox, node, level, path) {
          var i, len, child, targetNode, area, enlargement, minArea, minEnlargement;
          while (true) {
            path.push(node);
            if (node.leaf || path.length - 1 === level) break;
            minArea = minEnlargement = Infinity;
            for (i = 0, len = node.children.length; i < len; i++) {
              child = node.children[i];
              area = bboxArea(child);
              enlargement = enlargedArea(bbox, child) - area;
              if (enlargement < minEnlargement) {
                minEnlargement = enlargement;
                minArea = area < minArea ? area : minArea;
                targetNode = child;
              } else if (enlargement === minEnlargement) {
                if (area < minArea) {
                  minArea = area;
                  targetNode = child;
                }
              }
            }
            node = targetNode || node.children[0];
          }
          return node;
        },
        _insert: function(item, level, isNode) {
          var toBBox = this.toBBox, bbox = isNode ? item : toBBox(item), insertPath = [];
          var node = this._chooseSubtree(bbox, this.data, level, insertPath);
          node.children.push(item);
          extend(node, bbox);
          while (level >= 0) {
            if (insertPath[level].children.length > this._maxEntries) {
              this._split(insertPath, level);
              level--;
            } else break;
          }
          this._adjustParentBBoxes(bbox, insertPath, level);
        },
        // split overflowed node into two
        _split: function(insertPath, level) {
          var node = insertPath[level], M = node.children.length, m = this._minEntries;
          this._chooseSplitAxis(node, m, M);
          var splitIndex = this._chooseSplitIndex(node, m, M);
          var newNode = createNode(node.children.splice(splitIndex, node.children.length - splitIndex));
          newNode.height = node.height;
          newNode.leaf = node.leaf;
          calcBBox(node, this.toBBox);
          calcBBox(newNode, this.toBBox);
          if (level) insertPath[level - 1].children.push(newNode);
          else this._splitRoot(node, newNode);
        },
        _splitRoot: function(node, newNode) {
          this.data = createNode([node, newNode]);
          this.data.height = node.height + 1;
          this.data.leaf = false;
          calcBBox(this.data, this.toBBox);
        },
        _chooseSplitIndex: function(node, m, M) {
          var i, bbox1, bbox2, overlap, area, minOverlap, minArea, index;
          minOverlap = minArea = Infinity;
          for (i = m; i <= M - m; i++) {
            bbox1 = distBBox(node, 0, i, this.toBBox);
            bbox2 = distBBox(node, i, M, this.toBBox);
            overlap = intersectionArea(bbox1, bbox2);
            area = bboxArea(bbox1) + bboxArea(bbox2);
            if (overlap < minOverlap) {
              minOverlap = overlap;
              index = i;
              minArea = area < minArea ? area : minArea;
            } else if (overlap === minOverlap) {
              if (area < minArea) {
                minArea = area;
                index = i;
              }
            }
          }
          return index;
        },
        // sorts node children by the best axis for split
        _chooseSplitAxis: function(node, m, M) {
          var compareMinX = node.leaf ? this.compareMinX : compareNodeMinX, compareMinY = node.leaf ? this.compareMinY : compareNodeMinY, xMargin = this._allDistMargin(node, m, M, compareMinX), yMargin = this._allDistMargin(node, m, M, compareMinY);
          if (xMargin < yMargin) node.children.sort(compareMinX);
        },
        // total margin of all possible split distributions where each node is at least m full
        _allDistMargin: function(node, m, M, compare) {
          node.children.sort(compare);
          var toBBox = this.toBBox, leftBBox = distBBox(node, 0, m, toBBox), rightBBox = distBBox(node, M - m, M, toBBox), margin = bboxMargin(leftBBox) + bboxMargin(rightBBox), i, child;
          for (i = m; i < M - m; i++) {
            child = node.children[i];
            extend(leftBBox, node.leaf ? toBBox(child) : child);
            margin += bboxMargin(leftBBox);
          }
          for (i = M - m - 1; i >= m; i--) {
            child = node.children[i];
            extend(rightBBox, node.leaf ? toBBox(child) : child);
            margin += bboxMargin(rightBBox);
          }
          return margin;
        },
        _adjustParentBBoxes: function(bbox, path, level) {
          for (var i = level; i >= 0; i--) {
            extend(path[i], bbox);
          }
        },
        _condense: function(path) {
          for (var i = path.length - 1, siblings; i >= 0; i--) {
            if (path[i].children.length === 0) {
              if (i > 0) {
                siblings = path[i - 1].children;
                siblings.splice(siblings.indexOf(path[i]), 1);
              } else this.clear();
            } else calcBBox(path[i], this.toBBox);
          }
        },
        _initFormat: function(format) {
          var compareArr = ["return a", " - b", ";"];
          this.compareMinX = new Function("a", "b", compareArr.join(format[0]));
          this.compareMinY = new Function("a", "b", compareArr.join(format[1]));
          this.toBBox = new Function(
            "a",
            "return {minX: a" + format[0] + ", minY: a" + format[1] + ", maxX: a" + format[2] + ", maxY: a" + format[3] + "};"
          );
        }
      };
      function findItem(item, items, equalsFn) {
        if (!equalsFn) return items.indexOf(item);
        for (var i = 0; i < items.length; i++) {
          if (equalsFn(item, items[i])) return i;
        }
        return -1;
      }
      function calcBBox(node, toBBox) {
        distBBox(node, 0, node.children.length, toBBox, node);
      }
      function distBBox(node, k, p, toBBox, destNode) {
        if (!destNode) destNode = createNode(null);
        destNode.minX = Infinity;
        destNode.minY = Infinity;
        destNode.maxX = -Infinity;
        destNode.maxY = -Infinity;
        for (var i = k, child; i < p; i++) {
          child = node.children[i];
          extend(destNode, node.leaf ? toBBox(child) : child);
        }
        return destNode;
      }
      function extend(a, b) {
        a.minX = Math.min(a.minX, b.minX);
        a.minY = Math.min(a.minY, b.minY);
        a.maxX = Math.max(a.maxX, b.maxX);
        a.maxY = Math.max(a.maxY, b.maxY);
        return a;
      }
      function compareNodeMinX(a, b) {
        return a.minX - b.minX;
      }
      function compareNodeMinY(a, b) {
        return a.minY - b.minY;
      }
      function bboxArea(a) {
        return (a.maxX - a.minX) * (a.maxY - a.minY);
      }
      function bboxMargin(a) {
        return a.maxX - a.minX + (a.maxY - a.minY);
      }
      function enlargedArea(a, b) {
        return (Math.max(b.maxX, a.maxX) - Math.min(b.minX, a.minX)) * (Math.max(b.maxY, a.maxY) - Math.min(b.minY, a.minY));
      }
      function intersectionArea(a, b) {
        var minX = Math.max(a.minX, b.minX), minY = Math.max(a.minY, b.minY), maxX = Math.min(a.maxX, b.maxX), maxY = Math.min(a.maxY, b.maxY);
        return Math.max(0, maxX - minX) * Math.max(0, maxY - minY);
      }
      function contains(a, b) {
        return a.minX <= b.minX && a.minY <= b.minY && b.maxX <= a.maxX && b.maxY <= a.maxY;
      }
      function intersects(a, b) {
        return b.minX <= a.maxX && b.minY <= a.maxY && b.maxX >= a.minX && b.maxY >= a.minY;
      }
      function createNode(children) {
        return {
          children,
          height: 1,
          leaf: true,
          minX: Infinity,
          minY: Infinity,
          maxX: -Infinity,
          maxY: -Infinity
        };
      }
      function multiSelect(arr, left, right, n, compare) {
        var stack = [left, right], mid;
        while (stack.length) {
          right = stack.pop();
          left = stack.pop();
          if (right - left <= n) continue;
          mid = left + Math.ceil((right - left) / n / 2) * n;
          quickselect(arr, mid, left, right, compare);
          stack.push(left, mid, mid, right);
        }
      }
    }
  });

  // node_modules/img-bfs/src/img-bfs.js
  var require_img_bfs = __commonJS({
    "node_modules/img-bfs/src/img-bfs.js"(exports, module) {
      (function() {
        function bfs(img, startCoord, eventMap, blacklist) {
          var queue = _is("Array", startCoord) ? startCoord : [startCoord];
          if (_isImgLoaded(img)) {
            _bfs(_wrapByCanvas(img), queue, eventMap, blacklist);
          } else {
            img.addEventListener("load", function() {
              _bfs(_wrapByCanvas(img), queue, eventMap, blacklist);
            }, false);
          }
        }
        function _bfs(canvas, queue, eventMap, blacklist) {
          var ctx = canvas.getContext("2d"), imgSize = {
            w: canvas.width,
            h: canvas.height
          }, imgCols = ctx.getImageData(0, 0, imgSize.w, imgSize.h).data, visited = {}, stopMainLoop = false, skipNeighbords = false;
          if (blacklist !== void 0) {
            blacklist.forEach(function(coord2) {
              visited[coord2.x + "-" + coord2.y] = true;
            });
          }
          function visitPx(coord2) {
            visited[coord2.x + "-" + coord2.y] = true;
            if (eventMap !== void 0 && eventMap.onvisit !== void 0) {
              eventMap.onvisit({
                pixel: {
                  coord: coord2,
                  color: _getColorByXY(coord2, imgSize, imgCols)
                },
                stop: function() {
                  stopMainLoop = true;
                },
                skip: function() {
                  skipNeighbords = true;
                }
              });
            }
          }
          visitPx(queue[0]);
          mainLoop:
            while (queue.length > 0) {
              if (stopMainLoop) {
                break mainLoop;
              }
              var coord = queue.shift(), colPos = _getColorPositionByXY(coord, imgSize), col = [imgCols[colPos], imgCols[colPos + 1], imgCols[colPos + 2], imgCols[colPos + 3]], px = { coord, color: col }, nPxs = _getNeighborPixels(coord, imgSize, imgCols);
              for (var i = 0; i < nPxs.length; i++) {
                var nPx = nPxs[i];
                if (visited[nPx.coord.x + "-" + nPx.coord.y] !== true) {
                  visitPx(nPx.coord);
                  if (stopMainLoop) {
                    break mainLoop;
                  }
                  if (!skipNeighbords) {
                    queue.push(nPx.coord);
                  }
                  skipNeighbords = false;
                }
              }
            }
        }
        function _getColorPositionByXY(coord, imgSize) {
          return (coord.y - 1) * imgSize.w * 4 + (coord.x * 4 - 4);
        }
        function _getColorByXY(coord, imgSize, imgCols) {
          var colPos = _getColorPositionByXY(coord, imgSize);
          return [imgCols[colPos], imgCols[colPos + 1], imgCols[colPos + 2], imgCols[colPos + 3]];
        }
        function _getNeighborPixels(coord, imgSize, imgCols) {
          var res = [], pos;
          if (coord.x > 0 && coord.y > 0) {
            pos = {
              x: coord.x - 1,
              y: coord.y - 1
            };
            res.push({
              coord: pos,
              color: _getColorByXY(pos, imgSize, imgCols)
            });
          }
          if (coord.y > 0) {
            pos = {
              x: coord.x,
              y: coord.y - 1
            };
            res.push({
              coord: pos,
              color: _getColorByXY(pos, imgSize, imgCols)
            });
          }
          if (coord.x < imgSize.w && coord.y > 0) {
            pos = {
              x: coord.x + 1,
              y: coord.y - 1
            };
            res.push({
              coord: pos,
              color: _getColorByXY(pos, imgSize, imgCols)
            });
          }
          if (coord.x < imgSize.w) {
            pos = {
              x: coord.x + 1,
              y: coord.y
            };
            res.push({
              coord: pos,
              color: _getColorByXY(pos, imgSize, imgCols)
            });
          }
          if (coord.x < imgSize.w && coord.y < imgSize.h) {
            pos = {
              x: coord.x + 1,
              y: coord.y + 1
            };
            res.push({
              coord: pos,
              color: _getColorByXY(pos, imgSize, imgCols)
            });
          }
          if (coord.y < imgSize.h) {
            pos = {
              x: coord.x,
              y: coord.y + 1
            };
            res.push({
              coord: pos,
              color: _getColorByXY(pos, imgSize, imgCols)
            });
          }
          if (coord.x > 0 && coord.y < imgSize.h) {
            pos = {
              x: coord.x - 1,
              y: coord.y + 1
            };
            res.push({
              coord: pos,
              color: _getColorByXY(pos, imgSize, imgCols)
            });
          }
          if (coord.x > 0) {
            pos = {
              x: coord.x - 1,
              y: coord.y
            };
            res.push({
              coord: pos,
              color: _getColorByXY(pos, imgSize, imgCols)
            });
          }
          return res;
        }
        function _isImgLoaded(img) {
          return !(typeof img.naturalWidth !== "undefined" && img.naturalWidth === 0);
        }
        function _wrapByCanvas(img) {
          if (img.tagName === "CANVAS") {
            return img;
          }
          var canv = document.createElement("canvas");
          canv.width = img.width;
          canv.height = img.height;
          canv.getContext("2d").drawImage(img, 0, 0, img.width, img.height);
          return canv;
        }
        function _is(type, obj) {
          var clas = Object.prototype.toString.call(obj).slice(8, -1);
          return obj !== void 0 && obj !== null && clas === type;
        }
        if (typeof module !== "undefined") module.exports = bfs;
        else window.bfs = bfs;
      })();
    }
  });

  // node_modules/hull/src/intersect.js
  var require_intersect = __commonJS({
    "node_modules/hull/src/intersect.js"(exports, module) {
      function ccw(x1, y1, x2, y2, x3, y3) {
        const cw = (y3 - y1) * (x2 - x1) - (y2 - y1) * (x3 - x1);
        return cw > 0 ? true : cw < 0 ? false : true;
      }
      function intersect(seg1, seg2) {
        const x1 = seg1[0][0], y1 = seg1[0][1], x2 = seg1[1][0], y2 = seg1[1][1], x3 = seg2[0][0], y3 = seg2[0][1], x4 = seg2[1][0], y4 = seg2[1][1];
        return ccw(x1, y1, x3, y3, x4, y4) !== ccw(x2, y2, x3, y3, x4, y4) && ccw(x1, y1, x2, y2, x3, y3) !== ccw(x1, y1, x2, y2, x4, y4);
      }
      module.exports = intersect;
    }
  });

  // node_modules/hull/src/grid.js
  var require_grid = __commonJS({
    "node_modules/hull/src/grid.js"(exports, module) {
      function Grid(points, cellSize) {
        this._cells = [];
        this._cellSize = cellSize;
        this._reverseCellSize = 1 / cellSize;
        for (let i = 0; i < points.length; i++) {
          const point = points[i];
          const x = this.coordToCellNum(point[0]);
          const y = this.coordToCellNum(point[1]);
          if (!this._cells[x]) {
            const array = [];
            array[y] = [point];
            this._cells[x] = array;
          } else if (!this._cells[x][y]) {
            this._cells[x][y] = [point];
          } else {
            this._cells[x][y].push(point);
          }
        }
      }
      Grid.prototype = {
        cellPoints: function(x, y) {
          return this._cells[x] !== void 0 && this._cells[x][y] !== void 0 ? this._cells[x][y] : [];
        },
        rangePoints: function(bbox) {
          const tlCellX = this.coordToCellNum(bbox[0]);
          const tlCellY = this.coordToCellNum(bbox[1]);
          const brCellX = this.coordToCellNum(bbox[2]);
          const brCellY = this.coordToCellNum(bbox[3]);
          const points = [];
          for (let x = tlCellX; x <= brCellX; x++) {
            for (let y = tlCellY; y <= brCellY; y++) {
              for (let i = 0; i < this.cellPoints(x, y).length; i++) {
                points.push(this.cellPoints(x, y)[i]);
              }
            }
          }
          return points;
        },
        removePoint: function(point) {
          const cellX = this.coordToCellNum(point[0]);
          const cellY = this.coordToCellNum(point[1]);
          const cell = this._cells[cellX][cellY];
          let pointIdxInCell;
          for (let i = 0; i < cell.length; i++) {
            if (cell[i][0] === point[0] && cell[i][1] === point[1]) {
              pointIdxInCell = i;
              break;
            }
          }
          cell.splice(pointIdxInCell, 1);
          return cell;
        },
        trunc: Math.trunc || function(val) {
          return val - val % 1;
        },
        coordToCellNum: function(x) {
          return this.trunc(x * this._reverseCellSize);
        },
        extendBbox: function(bbox, scaleFactor) {
          return [
            bbox[0] - scaleFactor * this._cellSize,
            bbox[1] - scaleFactor * this._cellSize,
            bbox[2] + scaleFactor * this._cellSize,
            bbox[3] + scaleFactor * this._cellSize
          ];
        }
      };
      function grid(points, cellSize) {
        return new Grid(points, cellSize);
      }
      module.exports = grid;
    }
  });

  // node_modules/hull/src/format.js
  var require_format = __commonJS({
    "node_modules/hull/src/format.js"(exports, module) {
      module.exports = {
        toXy: function(pointset, format) {
          if (format === void 0) {
            return pointset.slice();
          }
          const xPropertyName = format[0].slice(1);
          const yPropertyName = format[1].slice(1);
          const _getXY = function(pt) {
            return [pt[xPropertyName], pt[yPropertyName]];
          };
          return pointset.map(_getXY);
        },
        fromXy: function(pointset, format) {
          if (format === void 0) {
            return pointset.slice();
          }
          const xPropertyName = format[0].slice(1);
          const yPropertyName = format[1].slice(1);
          const _getObj = function(pt) {
            const obj = {};
            obj[xPropertyName] = pt[0];
            obj[yPropertyName] = pt[1];
            return obj;
          };
          return pointset.map(function(pt) {
            return _getObj(pt);
          });
        }
      };
    }
  });

  // node_modules/hull/src/convex.js
  var require_convex = __commonJS({
    "node_modules/hull/src/convex.js"(exports, module) {
      function _cross(o, a, b) {
        return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
      }
      function _upperTangent(pointset) {
        const lower = [];
        for (let l = 0; l < pointset.length; l++) {
          while (lower.length >= 2 && _cross(lower[lower.length - 2], lower[lower.length - 1], pointset[l]) <= 0) {
            lower.pop();
          }
          lower.push(pointset[l]);
        }
        lower.pop();
        return lower;
      }
      function _lowerTangent(pointset) {
        const reversed = pointset.reverse(), upper = [];
        for (let u = 0; u < reversed.length; u++) {
          while (upper.length >= 2 && _cross(upper[upper.length - 2], upper[upper.length - 1], reversed[u]) <= 0) {
            upper.pop();
          }
          upper.push(reversed[u]);
        }
        upper.pop();
        return upper;
      }
      function convex(pointset) {
        const upper = _upperTangent(pointset), lower = _lowerTangent(pointset);
        const convex2 = lower.concat(upper);
        convex2.push(pointset[0]);
        return convex2;
      }
      module.exports = convex;
    }
  });

  // node_modules/hull/src/hull.js
  var require_hull = __commonJS({
    "node_modules/hull/src/hull.js"(exports, module) {
      "use strict";
      var intersect = require_intersect();
      var grid = require_grid();
      var formatUtil = require_format();
      var convexHull = require_convex();
      function _filterDuplicates(pointset) {
        const unique = [pointset[0]];
        let lastPoint = pointset[0];
        for (let i = 1; i < pointset.length; i++) {
          const currentPoint = pointset[i];
          if (lastPoint[0] !== currentPoint[0] || lastPoint[1] !== currentPoint[1]) {
            unique.push(currentPoint);
          }
          lastPoint = currentPoint;
        }
        return unique;
      }
      function _sortByX(pointset) {
        return pointset.sort(function(a, b) {
          return a[0] - b[0] || a[1] - b[1];
        });
      }
      function _sqLength(a, b) {
        return Math.pow(b[0] - a[0], 2) + Math.pow(b[1] - a[1], 2);
      }
      function _cos(o, a, b) {
        const aShifted = [a[0] - o[0], a[1] - o[1]], bShifted = [b[0] - o[0], b[1] - o[1]], sqALen = _sqLength(o, a), sqBLen = _sqLength(o, b), dot = aShifted[0] * bShifted[0] + aShifted[1] * bShifted[1];
        return dot / Math.sqrt(sqALen * sqBLen);
      }
      function _intersect(segment, pointset) {
        for (let i = 0; i < pointset.length - 1; i++) {
          const seg = [pointset[i], pointset[i + 1]];
          if (segment[0][0] === seg[0][0] && segment[0][1] === seg[0][1] || segment[0][0] === seg[1][0] && segment[0][1] === seg[1][1]) {
            continue;
          }
          if (intersect(segment, seg)) {
            return true;
          }
        }
        return false;
      }
      function _occupiedArea(pointset) {
        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;
        for (let i = pointset.length - 1; i >= 0; i--) {
          if (pointset[i][0] < minX) {
            minX = pointset[i][0];
          }
          if (pointset[i][1] < minY) {
            minY = pointset[i][1];
          }
          if (pointset[i][0] > maxX) {
            maxX = pointset[i][0];
          }
          if (pointset[i][1] > maxY) {
            maxY = pointset[i][1];
          }
        }
        return [
          maxX - minX,
          // width
          maxY - minY
          // height
        ];
      }
      function _bBoxAround(edge) {
        return [
          Math.min(edge[0][0], edge[1][0]),
          // left
          Math.min(edge[0][1], edge[1][1]),
          // top
          Math.max(edge[0][0], edge[1][0]),
          // right
          Math.max(edge[0][1], edge[1][1])
          // bottom
        ];
      }
      function _midPoint(edge, innerPoints, convex) {
        let point = null, angle1Cos = MAX_CONCAVE_ANGLE_COS, angle2Cos = MAX_CONCAVE_ANGLE_COS, a1Cos, a2Cos;
        for (let i = 0; i < innerPoints.length; i++) {
          a1Cos = _cos(edge[0], edge[1], innerPoints[i]);
          a2Cos = _cos(edge[1], edge[0], innerPoints[i]);
          if (a1Cos > angle1Cos && a2Cos > angle2Cos && !_intersect([edge[0], innerPoints[i]], convex) && !_intersect([edge[1], innerPoints[i]], convex)) {
            angle1Cos = a1Cos;
            angle2Cos = a2Cos;
            point = innerPoints[i];
          }
        }
        return point;
      }
      function _concave(convex, maxSqEdgeLen, maxSearchArea, grid2, edgeSkipList) {
        let midPointInserted = false;
        for (let i = 0; i < convex.length - 1; i++) {
          const edge = [convex[i], convex[i + 1]];
          const keyInSkipList = edge[0][0] + "," + edge[0][1] + "," + edge[1][0] + "," + edge[1][1];
          if (_sqLength(edge[0], edge[1]) < maxSqEdgeLen || edgeSkipList.has(keyInSkipList)) {
            continue;
          }
          let scaleFactor = 0;
          let bBoxAround = _bBoxAround(edge);
          let bBoxWidth;
          let bBoxHeight;
          let midPoint;
          do {
            bBoxAround = grid2.extendBbox(bBoxAround, scaleFactor);
            bBoxWidth = bBoxAround[2] - bBoxAround[0];
            bBoxHeight = bBoxAround[3] - bBoxAround[1];
            midPoint = _midPoint(edge, grid2.rangePoints(bBoxAround), convex);
            scaleFactor++;
          } while (midPoint === null && (maxSearchArea[0] > bBoxWidth || maxSearchArea[1] > bBoxHeight));
          if (bBoxWidth >= maxSearchArea[0] && bBoxHeight >= maxSearchArea[1]) {
            edgeSkipList.add(keyInSkipList);
          }
          if (midPoint !== null) {
            convex.splice(i + 1, 0, midPoint);
            grid2.removePoint(midPoint);
            midPointInserted = true;
          }
        }
        if (midPointInserted) {
          return _concave(convex, maxSqEdgeLen, maxSearchArea, grid2, edgeSkipList);
        }
        return convex;
      }
      function hull(pointset, concavity, format) {
        let maxEdgeLen = concavity || 20;
        const points = _filterDuplicates(_sortByX(formatUtil.toXy(pointset, format)));
        if (points.length < 4) {
          const concave2 = points.concat([points[0]]);
          return format ? formatUtil.fromXy(concave2, format) : concave2;
        }
        const occupiedArea = _occupiedArea(points);
        const maxSearchArea = [
          occupiedArea[0] * MAX_SEARCH_BBOX_SIZE_PERCENT,
          occupiedArea[1] * MAX_SEARCH_BBOX_SIZE_PERCENT
        ];
        const convex = convexHull(points);
        const innerPoints = points.filter(function(pt) {
          return convex.indexOf(pt) < 0;
        });
        const cellSize = Math.ceil(1 / (points.length / (occupiedArea[0] * occupiedArea[1])));
        const concave = _concave(
          convex,
          Math.pow(maxEdgeLen, 2),
          maxSearchArea,
          grid(innerPoints, cellSize),
          /* @__PURE__ */ new Set()
        );
        return format ? formatUtil.fromXy(concave, format) : concave;
      }
      var MAX_CONCAVE_ANGLE_COS = Math.cos(90 / (180 / Math.PI));
      var MAX_SEARCH_BBOX_SIZE_PERCENT = 0.6;
      module.exports = hull;
    }
  });

  // node_modules/disjoint-set/src/DisjointSet.js
  var require_DisjointSet = __commonJS({
    "node_modules/disjoint-set/src/DisjointSet.js"(exports, module) {
      (function() {
        "use strict";
        function disjointSet() {
          return new DisjointSet();
        }
        var DisjointSet = function() {
          this._reset();
        };
        DisjointSet.prototype = {
          add: function(val) {
            var id = this._isPrimitive(val) ? val : this._lastId;
            if (typeof val._disjointSetId === "undefined") {
              val._disjointSetId = this._relations[id] = id;
              this._objects[id] = val;
              this._size[id] = 1;
              this._lastId++;
            }
            return this;
          },
          find: function(val) {
            var id = this._isPrimitive(val) ? val : val._disjointSetId;
            return this._findById(id);
          },
          _findById: function(id) {
            var rootId = id;
            while (this._relations[rootId] !== rootId) {
              rootId = this._relations[rootId];
            }
            return rootId;
          },
          connected: function(val1, val2) {
            return this.find(val1) === this.find(val2) ? true : false;
          },
          union: function(val1, val2) {
            var val1RootId = this.find(val1), val2RootId = this.find(val2);
            if (val1RootId === val2RootId) {
              return this;
            }
            if (this._size[val1RootId] < this._size[val2RootId]) {
              this._relations[val1RootId] = val2RootId;
              this._size[val1RootId] += this._size[val2RootId];
            } else {
              this._relations[val2RootId] = val1RootId;
              this._size[val2RootId] += this._size[val1RootId];
            }
            return this;
          },
          extract: function() {
            var rootId, resObj = {}, resArr = [];
            for (var id in this._relations) {
              rootId = this._findById(id);
              if (typeof resObj[rootId] === "undefined") {
                resObj[rootId] = [];
              }
              resObj[rootId].push(this._objects[id]);
            }
            for (var key1 in resObj) {
              resArr.push(resObj[key1]);
            }
            return resArr;
          },
          destroy: function() {
            this._reset();
          },
          _isPrimitive: function(val) {
            if (typeof this.IS_PRIMITIVE !== "undefined") {
              return this.IS_PRIMITIVE;
            } else {
              this.IS_PRIMITIVE = DisjointSet._isPrimitive(val);
              return this.IS_PRIMITIVE;
            }
          },
          _reset: function() {
            for (var id in this._objects) {
              delete this._objects[id]._disjointSetId;
            }
            this._objects = {};
            this._relations = {};
            this._size = {};
            this._lastId = 0;
          }
        };
        DisjointSet._isPrimitive = function(val) {
          if (Object.prototype.toString.call(val) === "[object String]" || Object.prototype.toString.call(val) === "[object Number]") {
            return true;
          } else {
            return false;
          }
        };
        if (typeof define === "function" && define.amd) {
          define(function() {
            return disjointSet;
          });
        } else if (typeof module !== "undefined") {
          module.exports = disjointSet;
        } else if (typeof self !== "undefined") {
          self.disjointSet = disjointSet;
        } else {
          window.disjointSet = disjointSet;
        }
      })();
    }
  });

  // src/util/canvas.js
  var require_canvas = __commonJS({
    "src/util/canvas.js"(exports) {
      "use strict";
      function wrap(img) {
        if (!!(img.getContext && img.getContext("2d"))) {
          return img;
        }
        var canv = document.createElement("canvas");
        canv.width = img.width;
        canv.height = img.height;
        canv.getContext("2d").drawImage(img, 0, 0, img.width, img.height);
        return canv;
      }
      function colorPos2Point(colPos, imgSize) {
        var pt = { x: 0, y: 0 };
        pt.y = parseInt(colPos / (imgSize.w * 4));
        pt.x = colPos / 4 - pt.y * imgSize.w;
        return pt;
      }
      function point2ColorPos(pt, imgSize) {
        return (pt.y - 1) * imgSize.w * 4 + (pt.x * 4 - 4);
      }
      function neighborColors(colPos, imgCols, imgSize) {
        var res = [], tlPos, tPos, trPos, rPos, brPos, bPos, blPos, lPos, pt = colorPos2Point(colPos, imgSize);
        if (pt.x > 0 && pt.y > 0) {
          tlPos = colPos - 4 - imgSize.w * 4;
          res.push([
            // top left color
            imgCols[tlPos],
            imgCols[tlPos + 1],
            imgCols[tlPos + 2],
            imgCols[tlPos + 3]
          ]);
        }
        if (pt.y > 0) {
          tPos = colPos - imgSize.w * 4;
          res.push([
            // top color
            imgCols[tPos],
            imgCols[tPos + 1],
            imgCols[tPos + 2],
            imgCols[tPos + 3]
          ]);
        }
        if (pt.x < imgSize.w && pt.y > 0) {
          trPos = colPos - imgSize.w * 4 + 4;
          res.push([
            // top right color
            imgCols[trPos],
            imgCols[trPos + 1],
            imgCols[trPos + 2],
            imgCols[trPos + 3]
          ]);
        }
        if (pt.x < imgSize.w) {
          rPos = colPos + 4;
          res.push([
            // right color
            imgCols[rPos],
            imgCols[rPos + 1],
            imgCols[rPos + 2],
            imgCols[rPos + 3]
          ]);
        }
        if (pt.x < imgSize.w && pt.y < imgSize.h) {
          brPos = colPos + imgSize.w * 4 + 4;
          res.push([
            // bottom right color
            imgCols[brPos],
            imgCols[brPos + 1],
            imgCols[brPos + 2],
            imgCols[brPos + 3]
          ]);
        }
        if (pt.y < imgSize.h) {
          bPos = colPos + imgSize.w * 4;
          res.push([
            // bottom color
            imgCols[bPos],
            imgCols[bPos + 1],
            imgCols[bPos + 2],
            imgCols[bPos + 3]
          ]);
        }
        if (pt.x > 0 && pt.y < imgSize.h) {
          blPos = colPos + imgSize.w * 4 - 4;
          res.push([
            // bottom left color
            imgCols[blPos],
            imgCols[blPos + 1],
            imgCols[blPos + 2],
            imgCols[blPos + 3]
          ]);
        }
        if (pt.x > 0) {
          lPos = colPos - 4;
          res.push([
            // left color
            imgCols[lPos],
            imgCols[lPos + 1],
            imgCols[lPos + 2],
            imgCols[lPos + 3]
          ]);
        }
        return res;
      }
      function hex2Rgb(hex) {
        var num = parseInt(hex, 16);
        return [num >> 16, num >> 8 & 255, num & 255];
      }
      function rgb2Hex(rgb) {
        return (rgb[2] | rgb[1] << 8 | rgb[0] << 16 | 1 << 24).toString(16).slice(1);
      }
      function similarColors(rgb1, rgb2, tolerance) {
        var r = Math.abs(rgb1[0] - rgb2[0]) < tolerance, g = Math.abs(rgb1[1] - rgb2[1]) < tolerance, b = Math.abs(rgb1[2] - rgb2[2]) < tolerance;
        return r && g && b;
      }
      function colorInAllColors(col, cols, tolerance) {
        for (var i = 0; i < cols.length; i++) {
          if (similarColors(col, cols[i], tolerance) === false) {
            return false;
          }
        }
        return true;
      }
      function colorInColors(col, cols, tolerance) {
        for (var i = 0; i < cols.length; i++) {
          if (similarColors(col, cols[i], tolerance) === true) {
            return true;
          }
        }
        return false;
      }
      exports.wrap = wrap;
      exports.colorPos2Point = colorPos2Point;
      exports.point2ColorPos = point2ColorPos;
      exports.neighborColors = neighborColors;
      exports.hex2Rgb = hex2Rgb;
      exports.rgb2Hex = rgb2Hex;
      exports.similarColors = similarColors;
      exports.colorInColors = colorInColors;
      exports.colorInAllColors = colorInAllColors;
    }
  });

  // src/util/math.js
  var require_math = __commonJS({
    "src/util/math.js"(exports) {
      "use strict";
      function sqDist(pt1, pt2) {
        return Math.pow(pt2.x - pt1.x, 2) + Math.pow(pt2.y - pt1.y, 2);
      }
      exports.sqDist = sqDist;
    }
  });

  // src/util/dom.js
  var require_dom = __commonJS({
    "src/util/dom.js"(exports) {
      "use strict";
      function loaded(img) {
        return !(typeof img.naturalWidth !== "undefined" && img.naturalWidth === 0);
      }
      function onload(img, func) {
        if (loaded(img)) {
          func();
        } else {
          img.addEventListener("load", func, false);
        }
      }
      exports.loaded = loaded;
      exports.onload = onload;
    }
  });

  // src/pixfinder.js
  var require_pixfinder = __commonJS({
    "src/pixfinder.js"(exports) {
      var rbush = require_rbush();
      var bfs = require_img_bfs();
      var hull = require_hull();
      var disjointSet = require_DisjointSet();
      var util = {
        canvas: require_canvas(),
        math: require_math(),
        dom: require_dom()
      };
      function find(options) {
        var opt = _default(options), canv = util.canvas.wrap(opt.img), ctx = canv.getContext("2d"), imgSize = { w: canv.width, h: canv.height }, imgCols = ctx.getImageData(0, 0, imgSize.w, imgSize.h).data, colPos = util.canvas.point2ColorPos(opt.startPoint, imgSize), ptCol = [
          imgCols[colPos],
          imgCols[colPos + 1],
          imgCols[colPos + 2],
          imgCols[colPos + 3]
        ], tree = rbush(9, [".x", ".y", ".x", ".y"]);
        if (!_pointInObject(ptCol, opt)) {
          return [];
        }
        bfs(canv, opt.startPoint, {
          onvisit: function(e) {
            var pt = e.pixel.coord;
            if (_pointInObject(e.pixel.color, opt)) {
              tree.insert(pt);
            } else {
              var bbox = {
                minX: pt.x - opt.distance,
                minY: pt.y - opt.distance,
                maxX: pt.x + opt.distance,
                maxY: pt.y + opt.distance
              };
              if (tree.search(bbox).length === 0) {
                e.skip();
              }
            }
          }
        });
        return hull(tree.all(), opt.concavity, [".x", ".y"]);
      }
      function findAll(options) {
        var opt = _default(options), canv = util.canvas.wrap(opt.img), objectPts, objects;
        objectPts = _objectsPoints(
          canv,
          opt.colors,
          opt.accuracy,
          opt.tolerance
        );
        objects = _splitByDist(objectPts, opt.distance);
        objects = opt.clearNoise ? _clearNoise(objects, opt.clearNoise) : objects;
        return objects.map(function(points) {
          return hull(points, opt.concavity, [".x", ".y"]);
        });
      }
      function _default(options) {
        var opt = options;
        opt.accuracy = opt.accuracy || 2;
        opt.distance = opt.distance || 10;
        opt.tolerance = opt.tolerance || 50;
        opt.colors = opt.colors.map(util.canvas.hex2Rgb);
        opt.clearNoise = opt.clearNoise || false;
        opt.concavity = opt.concavity || 10;
        return opt;
      }
      function _pointInObject(ptColor, options) {
        return util.canvas.colorInColors(
          ptColor,
          options.colors,
          options.tolerance
        );
      }
      function _objectsPoints(canvas, colors, accuracy, tolerance) {
        var result = [], ctx = canvas.getContext("2d"), imgSize = { w: canvas.width, h: canvas.height }, imgCols = ctx.getImageData(0, 0, imgSize.w, imgSize.h).data;
        for (var i = 0; i < imgCols.length; i += 4 * accuracy) {
          var ptCol = [
            imgCols[i],
            imgCols[i + 1],
            imgCols[i + 2],
            imgCols[i + 3]
          ], nCols = util.canvas.neighborColors(i, imgCols, imgSize), pt = util.canvas.colorPos2Point(i, imgSize);
          if (util.canvas.colorInAllColors(ptCol, nCols, tolerance)) {
            continue;
          }
          if (util.canvas.colorInColors(ptCol, colors, tolerance)) {
            result.push(pt);
          }
        }
        return result;
      }
      function _splitByDist(points, dist) {
        var set = disjointSet(), tree = rbush(9, [".x", ".y", ".x", ".y"]);
        tree.load(points);
        points.forEach(function(pt) {
          var bbox = {
            minX: pt.x - dist,
            minY: pt.y - dist,
            maxX: pt.x + dist,
            maxY: pt.y + dist
          };
          var neighbours = tree.search(bbox);
          set.add(pt);
          neighbours.forEach(function(nPt) {
            set.add(nPt);
            if (!set.connected(pt, nPt)) {
              set.union(pt, nPt);
            }
          });
        });
        return set.extract();
      }
      function _clearNoise(objects, noise) {
        return objects.filter(function(obj) {
          return obj.length >= noise;
        });
      }
      exports.find = find;
      exports.findAll = findAll;
      exports.util = util;
    }
  });
  return require_pixfinder();
})();
