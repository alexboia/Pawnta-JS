/*
* This is a modified version of the built-in HTML formatter.
* Its purpose is to produce a to-docx-converter friendly HTML output, while making as few compromises as possible
* */

var cheerio = require('cheerio');
var CSL = require('./processor/citeproc_commonjs.js');

//escape the text for safe insertion into the HTML document
function bibEscapeText(text) {
    if (!text) {
        text = "";
    }
    return text.replace(/&/g, "&#38;")
        .replace(/</g, "&#60;")
        .replace(/>/g, "&#62;")
        .replace("  ", "&#160; ", "g")
        .replace(CSL.SUPERSCRIPTS_REGEXP,
        function(aChar) {
            return "<sup>" + CSL.SUPERSCRIPTS[aChar] + "</sup>";
        });
}

//before releasing it out into the wild, an entry has to adjusted a little bit
function bibParseEntry(entry) {
    var $ = cheerio.load(entry);
    $('span.bib-block').each(function(idx, el) {
        var el = $(el);
        if (el[0].next) {
            el.after('<br />');
        }
    });
    $('span.bib-indent').each(function(idx, el) {
        var el = $(el);
        if (el[0].next) {
            el.after('<br />');
        }
        el.before('<span class="bib-indentation">&#09;</span>');
    });
    $('span.bib-right-inline').each(function(idx, el) {
        var el = $(el);
        if (el[0].next) {
            el.after('<br />');
        }
    });
    $('span.bib-left-margin').each(function(idx, el) {
        var el = $(el);
        var next = el[0].next;
        if (!next) {
            return;
        }
        if (!$(next).hasClass('bib-right-inline')) {
            el.after('<br />');
        } else {
            el.after('<span class="bib-spacer">&nbsp;</span>');
        }
    });
    return $.html();
}

exports.HTML = {
    'bibstart': '',
    'bibend': '',

    "text_escape": function(text) {
        return bibEscapeText(text);
    },

    "@font-style/italic": '<i>%%STRING%%</i>',
    "@font-style/oblique": '<em>%%STRING%%</em>',
    "@font-style/normal": '<span style="font-style: normal;">%%STRING%%</span>',

    "@font-variant/small-caps": '<span style="font: small-caps">%%STRING%%</span>',
    "@font-variant/normal": '<span style="font: normal">%%STRING%%</span>',

    "@passthrough/true": function(state, str) {
        return CSL.Output.Formatters.passthrough(state, str);
    },

    "@font-weight/bold": '<b>%%STRING%%</b>',
    "@font-weight/normal": '<span style="font-weight: normal;">%%STRING%%</span>',
    "@font-weight/light": false,

    "@text-decoration/none": '<span style="text-decoration: none">%%STRING%%</span>',
    "@text-decoration/underline": '<span style="text-decoration: underline">%%STRING%%</span>',

    "@vertical-align/sup": '<sup>%%STRING%%</sup>',
    "@vertical-align/sub": '<sub>%%STRING%%</sub>',
    "@vertical-align/baseline": false,

    "@strip-periods/true": function(state, str) {
        return CSL.Output.Formatters.passthrough(state, str);
    },
    "@strip-periods/false": function(state, str) {
        return CSL.Output.Formatters.passthrough(state, str);
    },

    "@quotes/true": function (state, str) {
        if ('undefined' === typeof str) {
            return state.getTerm('open-quote');
        }
        return state.getTerm('open-quote') + str + state.getTerm('close-quote');
    },
    "@quotes/inner": function (state, str) {
        if ('undefined' === typeof str) {
            return "\u2019";
        }
        return state.getTerm('open-inner-quote') + str + state.getTerm('close-inner-quote');
    },
    "@quotes/false": false,

    "@cite/entry": false,
    "@bibliography/entry": function (state, str) {
        return bibParseEntry('<p class="bib-entry">' + str + '</p>');
    },

    "@display/left-margin": function (state, str) {
        return '<span class="bib-left-margin">' + str + '</span>';
    },
    "@display/right-inline": function (state, str) {
        return '<span class="bib-right-inline">' + str + '</span>';
    },
    "@display/block": function (state, str) {
        return '<span class="bib-block">' + str + '</span>';
    },
    "@display/indent": function (state, str) {
        return '<span class="bib-indent">' + str + '</span>';
    },

    "@showid/true": false,

    "@URL/true": false,
    "@DOI/true": false
};