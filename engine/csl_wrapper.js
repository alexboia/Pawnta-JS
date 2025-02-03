function CSLWrapper(engine) {
	this._engine = engine;
	this._sys = engine.sys;
};

CSLWrapper.prototype.generateCitation = function(item) {
	var citation;
	var items = {};
	var page = arguments.length > 1 ? arguments[1] : null;
	var citation = {
		'citationItems': [{
			id: item.id
		}],
		'properties': {
			'noteIndex': 1
		}
	};

	if (page) {
		citation.citationItems[0].label = 'page';
		citation.citationItems[0].locator = page;
	}
	items[item.id] = item;

	this._sys.loadItems(items);
	try {
		citation = this._engine.appendCitationCluster(citation);
	} catch (err) {
		citation = null;
	}
	this._engine.updateItems([]);
	this._engine.restoreProcessorState();

	return citation ? citation[0][1] : null;
};

CSLWrapper.prototype.generateBibliography = function(items) {
	var engine = this._engine;
	var bibliography;
	var citedItems = {};
	var citations = [];
	var item, citation;
	var formattedCitation;
	var noteIndex = 1;
	var id, idMap = {};
	var ids = [];
	var result = {
		Bibliography: null,
		Citations: {}
	};

	try {
		for (var i = 0; i < items.length; i ++) {
			item = items[i];
			citedItems[item.Data.id] = item.Data;
			citation = this.getCitationObject(item.Data, item.Page, noteIndex ++);
			citations.push(citation);
			ids.push(item.Data.id);
			idMap[item.Data.id] = item.Id;
		}

		this._sys.loadItems(citedItems);
		for (var i = 0; i < citations.length; i ++) {
			citation = citations[i];
			formattedCitation = engine.appendCitationCluster(citation);
			id = citation.citationItems[0].id;
			id = idMap[id];
			if (formattedCitation && formattedCitation.length) {
				result.Citations[id] = {
					Id: id,
					Citation: formattedCitation[0][1],
					NoteIndex: citation.properties.noteIndex
				}
			} else {
				result.Citations[id] = {
					Id: id,
					Text: null,
					NoteIndex: citation.properties.noteIndex
				}
			}
		}

		engine.updateItems(ids);
		engine.setAbbreviations('default');
		engine.setOutputFormat('html');
		bibliography = engine.makeBibliography();
	} catch (err) {
		bibliography = null;
	}

	if (bibliography != null && !this.bibHasErrors(bibliography)) {
		result.Bibliography = this.getBibResult(bibliography);
	} else {
		result.Bibliography = null;
	}

	engine.updateItems([]);
	engine.restoreProcessorState();

	return result;
};

CSLWrapper.prototype.getBibResult = function(bib) {
	var parts = [];
	var bibMeta = bib[0] || {};
	var bibStart = bibMeta.bibstart || '';
	var bibEnd = bibMeta.bibend || '';
	var entries = bib[1] || [];
	var result = {
		EntrySpacing: bibMeta.entryspacing || 0,
		LineSpacing: bibMeta.linespacing || 0,
		MaxOffset: bibMeta.maxoffset || 0,
		HangingIndent: bibMeta.hangingindent || 0,
		Title: this.getLocalizedBibTitle(),
		Entries: entries
	};
	return result;
};

CSLWrapper.prototype.getCitationObject = function(item, page, noteIndex) {
	var citation = {
		'citationItems': [{
			id: item.id
		}],
		'properties': {
			'noteIndex': noteIndex
		}
	};
	if (page) {
		citation.citationItems[0].label = 'page';
		citation.citationItems[0].locator = page;
	}
	return citation;
};

CSLWrapper.prototype.getLocalizedBibTitle = function() {
	if (!this._engine) {
		return '';
	}
	return this._engine.getTerm('bibliography-title') || 'Bibliography';
};

CSLWrapper.prototype.bibHasErrors = function(bib) {
	return bib.bibliography_errors != undefined &&
		bib.bibliography_errors.length > 0;
};

CSLWrapper.prototype.dispose = function() {
	this._engine = null;
	this._sys = null;
};

exports.CSLWrapper = CSLWrapper;