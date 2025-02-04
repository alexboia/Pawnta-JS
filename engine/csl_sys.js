/**
 * Required by the CSL.Engine() constructor. 
 * Must be a JavaScript object providing (at least) the functions retrieveLocale() and retrieveItem()
 * 
 * @see https://citeproc-js.readthedocs.io/en/latest/running.html
 */

function CSLSys(locales, abbrevs) {
	this._locales = locales;
	this._abbrevs = abbrevs;
	this._items = {};
}

CSLSys.prototype.retrieveLocale = function(localeId) {
	if (this._locales && this._locales.has(localeId)) {
		return this._locales.get(localeId);
	}
	return null;
};

CSLSys.prototype.loadItems = function(items) {
	this._items = items || {};
};

CSLSys.prototype.retrieveItem = function(itemId) {
	if (this._items && this._items.hasOwnProperty(itemId)) {
		return this._items[itemId];
	}
	return null;
};

CSLSys.prototype.clearItems = function() {
	this._items = {};
};

CSLSys.prototype.getAbbreviation = function(abbrId) {
	if (this._abbrevs && this._abbrevs.hasOwnProperty(abbrId)) {
		return this._abbrevs[abbrId];
	}
	return null;
};

CSLSys.prototype.dispose = function() {
	this._locales = null;
	this._abbrevs = null;
	this._items = null;
};

exports.CSLSys = CSLSys;