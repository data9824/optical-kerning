/*
 * MIT License
 *
 * Copyright (c) 2017 Takuya Nishida
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

(function(factory) {
	if (typeof define === 'function' && define.amd) {
        define('optical-kerning', ['jquery'], factory);
	} else if (typeof module === "object" && typeof module.exports === "object") {
		module.exports = factory(require("jquery"));
	} else {
		factory(jQuery);
	}
}(function($) {
	var excluded_tags = ['option', 'script', 'textarea'];
	var analyzer = null;

	function Analyzer() {
		var height = 32;
		var width = 128;
		var margin = 16;
		var tiles = 64;
		var preparedCache = {};
		var gapCache = {};
		var canvas = document.createElement('canvas');
		canvas.width = width;
		canvas.height = height * 2 * tiles;
		canvas.style.display = "none";
		// calculating gaps is failed for unknown reason for Yu Gothic.
		// if the canvas is not in the document.
		document.body.appendChild(canvas);
		var context = canvas.getContext('2d');
		context.fillStyle = '#000000';
		context.textBaseline = 'middle';
		var image;
		var imageTop = 0;
		var analyzeFuncs = [];

		this.prepareGap = function(ch1, ch2, fontStyle, fontWeight, fontFamily, options) {
			if (constructHash(preparedCache, fontStyle, fontWeight, fontFamily, ch1, ch2, true) === true) {
				return;
			}
			if (imageTop === 0) {
				context.clearRect(0, 0, width, height * 2 * tiles);
			}
			context.font = fontStyle + ' ' + fontWeight + ' ' + height + 'px ' + fontFamily;
			var ch1Width = context.measureText(ch1).width;
			context.fillText(ch1, 0, imageTop + height);
			var center = Math.ceil(ch1Width) + margin;
			context.fillText(ch2, center + margin, imageTop + height);
			var top = imageTop;
			imageTop += height * 2;
			var analyze = function analyzeImage() {
				var vertices = convexHull(image, 0, top, center, height * 2, true);
				var leftBorders = new Array(height * 2);
				if (vertices.length > 0) {
					for (var i = 1; i < vertices.length; ++i) {
						var x0 = vertices[i - 1].x;
						var y0 = vertices[i - 1].y;
						var x1 = vertices[i].x;
						var y1 = vertices[i].y;
						for (var y = y0; y <= y1; ++y) {
							var x = x0 + Math.floor((x1 - x0) * (y - y0) / (y1 - y0) + 0.5);
							leftBorders[y] = x;
						}
					}
				}
				vertices = convexHull(image, center, top, width - center, height * 2, false);
				var rightBorders = new Array(height * 2);
				if (vertices.length > 0) {
					for (var i = 1; i < vertices.length; ++i) {
						var x0 = vertices[i - 1].x;
						var y0 = vertices[i - 1].y;
						var x1 = vertices[i].x;
						var y1 = vertices[i].y;
						for (var y = y0; y >= y1; --y) {
							var x = x0 + Math.floor((x1 - x0) * (y - y0) / (y1 - y0) + 0.5);
							rightBorders[y] = x;
						}
					}
				}
				var gaps = [];
				for (var y = top; y < top + height * 2; ++y) {
					if (leftBorders[y] !== undefined && rightBorders[y] !== undefined) {
						gaps.push(Math.max(0, rightBorders[y] - leftBorders[y] - 1 - margin * 2));
					}
				}
				var gap;
				if (gaps.length === 0) {
					var max = -Number.MAX_VALUE;
					var min = Number.MAX_VALUE;
					for (var y = top; y < top + height * 2; ++y) {
						if (leftBorders[y] !== undefined && max < leftBorders[y]) {
							max = leftBorders[y];
						}
						if (rightBorders[y] !== undefined && min > rightBorders[y]) {
							min = rightBorders[y];
						}
					}
					if (max !== -Number.MAX_VALUE && min !== Number.MAX_VALUE) {
						gap = (min - max - 1 - margin * 2) / height * options.factor;
					} else {
						gap = 0;
					}
				} else {
					var min = gaps[0];
					for (var i = 0; i < gaps.length; ++i) {
						min = Math.min(min, gaps[i]);
					}
					gap = min / height * options.factor;
				}
				constructHash(gapCache, fontStyle, fontWeight, fontFamily, ch1, ch2, gap);
			};
			analyzeFuncs.push(analyze);
			if (analyzeFuncs.length === tiles) {
				analyzeAll();
			}
		};

		this.getGap = function(ch1, ch2, fontStyle, fontWeight, fontFamily) {
			if (analyzeFuncs.length > 0) {
				analyzeAll();
			}
			return gapCache[fontStyle][fontWeight][fontFamily][ch1][ch2];
		};

		this.dispose = function() {
			document.body.removeChild(canvas);
		}

		function constructHash() {
			var hash = arguments[0];
			for (var i = 1; i < arguments.length - 2; ++i) {
				if (hash[arguments[i]] === undefined) {
					hash[arguments[i]] = {};
				}
				hash = hash[arguments[i]];
			}
			var old = hash[arguments[arguments.length - 2]];
			hash[arguments[arguments.length - 2]] = arguments[arguments.length - 1];
			return old;
		}

		function convexHull(image, sx, sy, width, height, right) {
			var vertices = [];
			if (right) {
				for (var y = sy; y < sy + height; ++y) {
					var i = 3 + 4 * ((sx + width - 1) + y * image.width);
					for (var x = sx + width - 1; x >= sx; --x, i -= 4) {
						if (image.data[i] !== 0) {
							vertices.push({x: x, y: y});
							break;
						}
					}
				}
			} else {
				for (var y = sy + height - 1; y >= sy; --y) {
					var i = 3 + 4 * (sx + y * image.width);
					for (var x = sx; x < sx + height; ++x, i += 4) {
						if (image.data[i] !== 0) {
							vertices.push({x: x, y: y});
							break;
						}
					}
				}
			}
			var hull = [];
			for (var i = 0; i < vertices.length; ++i) {
				hull.push(vertices[i]);
				while (hull.length >= 3) {
					var x0 = hull[hull.length - 3].x;
					var y0 = hull[hull.length - 3].y;
					var x1 = hull[hull.length - 2].x;
					var y1 = hull[hull.length - 2].y;
					var x2 = hull[hull.length - 1].x;
					var y2 = hull[hull.length - 1].y;
					if ((x1 - x0) * (y2 - y0) - (y1 - y0) * (x2 - x0) > 0) {
						break;
					}
					hull[hull.length - 2] = hull[hull.length - 1];
					--hull.length;
				}
			}
			return hull;
		}

		function analyzeAll() {
			image = context.getImageData(0, 0, width, height * 2 * tiles);
			for (var i = 0; i < analyzeFuncs.length; ++i) {
				analyzeFuncs[i]();
			}
			image = null;
			imageTop = 0;
			analyzeFuncs.length = 0;
		}
		return this;
	}

	function removeKerning(element) {
		var text = '';
		var toRemove = [];
		function replace() {
			if (toRemove.length > 0) {
				node.parentNode.insertBefore(document.createTextNode(text), toRemove[0]);
				for (var k = 0; k < toRemove.length; ++k) {
					node.parentNode.removeChild(toRemove[k]);
				}
				toRemove.length = 0;
				text = '';
			}
		}
		var nextNode;
		for (var node = element.firstChild; node !== null; node = nextNode) {
			nextNode = node.nextSibling;
			if (node.nodeType === 1) {
				if (node.className === 'optical-kerning-applied') {
					text += node.textContent;
					toRemove.push(node);
				} else {
					replace();
					removeKerning(node);
				}
			} else {
				replace();
			}
		}
		replace();
		element.normalize();
	}

	function calcKerning(element, options) {
		for (var node = element.firstChild; node !== null; node = node.nextSibling) {
			if (node.nodeType === 1) {
				if (node.style.letterSpacing !== '') {
					continue;
				}
				if (excluded_tags.indexOf(node.tagName.toLowerCase()) >= 0) {
					continue;
				}
				calcKerning(node, options);
			} else if (node.nodeType === 3) {
				if (node.nodeValue.match(/^[\s\t\r\n]*$/)) {
					continue;
				}
				var fontStyle = window.getComputedStyle(node.parentNode).fontStyle;
				var fontWeight = window.getComputedStyle(node.parentNode).fontWeight;
				var fontFamily = window.getComputedStyle(node.parentNode).fontFamily;
				var text = node.nodeValue;
				for (var i = 0; i < text.length - 1; ++i) {
					if (excluded(text[i], options.exclude) ||
						excluded(text[i + 1], options.exclude)
					) {
						continue;
					}
					analyzer.prepareGap(text[i], text[i + 1],
						fontStyle, fontWeight, fontFamily, options);
				}
			}
		}
	}

	function applyKerning(element, options) {
		var nextNode;
		for (var node = element.firstChild; node !== null; node = nextNode) {
			nextNode = node.nextSibling;
			if (node.nodeType === 1) {
				if (node.style.letterSpacing !== '') {
					continue;
				}
				if (excluded_tags.indexOf(node.tagName.toLowerCase()) >= 0) {
					continue;
				}
				applyKerning(node, options);
			} else if (node.nodeType === 3) {
				if (node.nodeValue.match(/^[\s\t\r\n]*$/)) {
					continue;
				}
				var fontStyle = window.getComputedStyle(node.parentNode).fontStyle;
				var fontWeight = window.getComputedStyle(node.parentNode).fontWeight;
				var fontFamily = window.getComputedStyle(node.parentNode).fontFamily;
				var text = node.nodeValue;
				var spans = document.createDocumentFragment();
				for (var i = 0; i < text.length - 1; ++i) {
					if (excluded(text[i], options.exclude) ||
						excluded(text[i + 1], options.exclude)
					) {
						var textNode = document.createTextNode(text[i]);
						spans.appendChild(textNode);
						continue;
					}
					var gap = analyzer.getGap(text[i], text[i + 1], fontStyle, fontWeight, fontFamily);
					var span = document.createElement('span');
					span.setAttribute('class', 'optical-kerning-applied');
					span.setAttribute('style', 'letter-spacing: ' + (-gap) + 'em');
					span.textContent = text[i];
					spans.appendChild(span);
				}
				var textNode = document.createTextNode(text[text.length - 1]);
				spans.appendChild(textNode);
				spans.normalize();
				node.parentNode.insertBefore(spans, node);
				node.parentNode.removeChild(node);
			}
		}
	}

	function excluded(ch, exclude) {
		var code = ch.charCodeAt(0);
		for (var i = 0; i < exclude.length; ++i) {
			if (Array.isArray(exclude[i])) {
				if (exclude[i][0] <= code && code <= exclude[i][1]) {
					return true;
				}
			} else if (typeof exclude[i] === "string") {
				for (var k = 0; k < exclude[i].length; ++k) {
					if (exclude[i].charCodeAt(k) === code) {
						return true;
					}
				}
			}
		}
		return false;
	}

	$.fn.kerning = function(options) {
		options = $.extend({
			factor: 0.5,
			exclude: [],
		}, options);
		options.factor = Number(options.factor);
		analyzer = new Analyzer();
		this.each(function() {
			removeKerning(this);
			if (options.factor !== 0.0) {
				calcKerning(this, options);
				applyKerning(this, options);
			}
		});
		analyzer.dispose();
		analyzer = null;
		return this;
	};
	return $.fn.kerning;
}));
