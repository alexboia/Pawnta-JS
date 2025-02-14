function bibEscapeText(text) {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

function bibFormatText(opt, val) {
    return [
        '<formatted opt="' + opt + '" val="' + val + '">',
                (arguments.length != 3 ? "%%STRING%%" : arguments[2]),
        '</formatted>'
    ].join('');
}

exports.XML = {
    "text_escape": function(text) {
        return bibEscapeText(text);
    },

    "bibstart": '<bibliography maxOffset="{maxOffset}" entrySpacing="{entrySpacing}" lineSpacing="{lineSpacing}" handingIndent="{hangingIndent}">',
    "bibend": '</bibliography>',

    "@font-style/italic": bibFormatText("FontStyle", "italic"),
    "@font-style/oblique": bibFormatText("FontStyle", "oblique"),
    "@font-style/normal": bibFormatText("FontStyle", "normal"),

    "@font-variant/small-caps": bibFormatText("FontVariant", "small-caps"),
    "@font-variant/normal": bibFormatText("FontVariant", "normal"),

    "@passthrough/true": function(state, string) {
        return bibEscapeText(csl.Output.Formatters.passthrough(state, string));
    },

    "@font-weight/bold": bibFormatText("FontWeight", "bold"),
    "@font-weight/normal": bibFormatText("FontWeight", "normal"),
    "@font-weight/light": bibFormatText("FontWeight", "light"),

    "@text-decoration/none": bibFormatText("TextDecoration", "none"),
    "@text-decoration/underline": bibFormatText("TextDecoration", "underline"),

    "@vertical-align/sup": bibFormatText("VerticalAlign", "sup"),
    "@vertical-align/sub": bibFormatText("VerticalAlign", "sub"),
    "@vertical-align/baseline": bibFormatText("VerticalAlign", "baseline"),

    "@strip-periods/true": function(state, string) {
        return bibEscapeText(csl.Output.Formatters.passthrough(state, string));
    },
    "@strip-periods/false": function(state, string) {
        return bibEscapeText(csl.Output.Formatters.passthrough(state, string));
    },

    "@quotes/true": function(state, str) {
        if (typeof str === 'undefined') {
            bibEscapeText(state.getTerm("open-quote"));
        }
        return bibEscapeText(state.getTerm("open-quote") + str + state.getTerm("close-quote"));
    },
    "@quotes/inner": function(state, str) {
        if (typeof str == 'undefined') {
            return bibEscapeText('\u2019');
        }
        return bibEscapeText(state.getTerm("open-inner-quote") + str + state.getTerm("close-inner-quote"));
    },
    "@quotes/false": false,

    "@cite/entry": false,
    "@bibliography/entry": function (state, str) {
        return '<entry>' + str + '</entry>';
    },

    "@display/block": function (state, str) {
        return bibFormatText("display", "block", str);
    },
    "@display/left-margin": function (state, str) {
        return bibFormatText("display", "left-margin", str);
    },
    "@display/right-inline": function (state, str) {
        return bibFormatText("display", "right-inline", str);
    },
    "@display/indent": function (state, str) {
        return bibFormatText("display", "indend", str);
    },
    "@showid/true": false,
    "@URL/true": false,
    "@DOI/true": false
};