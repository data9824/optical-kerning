# optical-kerning.js

*Optical Kerning jQuery Plugin*

This jQuery plugin enables you to apply optical kerning for any text in any fonts, dynamically analyzing the shapes of the text on your browser to apply the "letter-spacing" CSS property on each letter.

あらゆるフォントのあらゆるテキストにオプティカルカーニングを適用できるようにするjQueryプラグインです。ブラウザ上で動的にテキストの形状を分析し、それぞれの文字に "letter-spacing" CSSプロパティを適用します。

![Screenshot](https://raw.githubusercontent.com/data9824/optical-kerning/master/demo/screenshot.png)

* [Demo #1](https://data9824.github.io/optical-kerning/demo/demo1.html)
* [Demo #2](https://data9824.github.io/optical-kerning/demo/demo2.html)
* [Demo #3](https://data9824.github.io/optical-kerning/demo/demo3.html)

## Usage

### Browser

Just place *optical-kerning.js* on your website.

Webサイトに *optical-kerning.js* を配置してください。

```html
<script src="jquery-{any version}.js" type="text/javascript"></script>
<script src="optical-kerning.js" type="text/javascript"></script>
<script type="text/javascript">
	$(function() {
		$('.any-selector-you-want').kerning({
			factor: 0.5,
			exclude: [[0x00, 0xFF]]
		});
	});
</script>
```

### Node.js

```
$ npm install optical-kerning
```

```javascript
require('jquery');
require('optical-kerning');
$('.any-selector-you-want').kerning({
	factor: 0.5,
	exclude: [[0x00, 0xFF]]
});
```

## Notice

### Web Fonts

When you use web fonts, you need to (re-)apply kerning after downloading fonts. You can use [Web Font Loader](https://github.com/typekit/webfontloader) to get notified when the fonts have been loaded. See the following example.

Webフォントを利用する際には、フォントをダウンロードした後にカーニングを（再）適用する必要があります。フォントがロードされた時に通知を受けるために、[Web Font Loader](https://github.com/typekit/webfontloader)を利用できます。以下の例をご参照ください。

```javascript
function update() {
	$('.kerned').kerning({
		exclude: [[0x00, 0xFF]]
	});
}
WebFont.load({
	custom: {
		families: [ 'Mplus 1p:n4', 'Noto Sans Japanese:n4', 'Sawarabi Mincho:n4' ]
	},
	fontactive: function(familyName, fvd) {
		update();
	}
});
```

### Ligature

Many of Latin fonts have ligatures, custom shapes for specific letter sequences such as "fi". If your font has a ligature, applying this plugin would break the ligature apart making the text ugly. For that reason, it is recommended not to apply this plugin on Latin characters as shown in above usage with *exclude* option.

多くの欧文フォントはリガチャ、すなわち "fi" のような特定の文字列に対する特別な字形を持っています。もしフォントがリガチャを持っていた場合、このプラグインを適用するとリガチャが分断され、テキストが醜くなってしまいます。そのため、上記使用法の *exclude* オプションで示したように、このプラグインは欧文には適用しないことをお勧めします。

### OpenType Features

OpenType fonts can have proportional widths and kerning metrics, which can be enabled with CSS property as follows. However, this plugin doesn't take these property into account. Avoid enabling these features on the element you're applying this plugin on.

OpenTypeフォントは、プロポーショナル幅やカーニングメトリクスを持つことができ、以下のCSSプロパティで有効にできます。しかしながら、このプラグインはこれらのプロパティを考慮しません。このプラグインを適用する要素でこれらの機能を有効にするのは避けてください。

```css
{
	font-feature-settings : "pwid" 1, "kern" 1;
}
```

## Reference

### kerning()

Applies optical kerning on every descendant of the given jQuery object.

与えられたjQueryオブジェクトの全ての子孫にオプティカルカーニングを適用します。

```javascript
kerning({options});
```

*options* is an array that can contain following index and values.

* factor - A factor of kerning strength. 0.0 means no kerning, and 1.0 means kerning is strong enough that adjacent letters are just about to collide. The default value is 0.5.
* exclude - An array of range or string to specify letters that must not be applied kerning on. The range should contain 2 elements to specify the start and end of the character code that you want to prohibit kerning, inclusive. The string should consist of letters that you want to prohibit kerning. The default value is [].

*options* は以下のインデックスと値を設定できる配列です。

* factor - カーニング強度の係数です。0.0はカーニング無しを意味します。1.0は隣り合う文字がちょうど衝突する強さのカーニングを意味します。デフォルト値は0.5です。
* exclude - カーニングを適用してはならない文字を指定する、範囲や文字列の配列です。範囲はカーニングを禁止する文字コードの開始と終了の2要素で構成されます（範囲は開始と終了の値も含む）。文字列はカーニングを禁止する文字で構成されます。デフォルト値は[]です。

To remove previously applied kerning, call this function with *options.factor=0*.

以前に適用されたカーニングを除去するには、 *options.factor=0* としてこの関数を呼んでください。

## License

MIT License.

Copyright (c) 2017 Takuya Nishida
