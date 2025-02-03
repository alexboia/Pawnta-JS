const config = require('./engine/config.js').config;
const engine = require('./engine/engine.js');
const items = require('./engine/items.js');

const express = require('express');
const server = express();

function _writeJson(response, obj) {
	response.status(200);
	response.send(obj);
}

function _badRequest(response) {
	response.status(400);
}

function _getAvailableStyles() {
	return new Promise((resolve, reject) => {
		const result = {
			Success: true,
			Styles: null
		};
	
		engine.getAvailableStyles()
			.then(availableStyles => {
				result.Styles = availableStyles;
				resolve(result);
			})
			.catch(stylesError => {
				result.Success = false;
				resolve(result);
			});
	});
}

function _getAvailableLocales() {
	return new Promise((resolve, reject) => {
		const result = {
			Success: true,
			Locales: null
		};

		engine.getAvailableLocales()
			.then(availableLocales => {
				result.Locales = availableLocales;
				resolve(result);
			})
			.catch(localesError => {
				result.Success = false;
				resolve(result);
			});
	});
}

function _generateCitation(reqData) {
	return new Promise((resolve, reject) => {
		let item = null;
		let page = null;

		const result = {
			Success: true,
			Citation: null
		};

		if (!reqData || !(item = items.buildItemFromRequest(reqData))) {
			result.Success = false;
			resolve(result);
			return;
		}

		//set default styles
		if (!reqData.Style) {
			reqData.Style = config.defaults.style;
	   }
	   if (!reqData.Locale) {
		   reqData.Locale = config.defaults.locale;
	   }

	   //set page, if specified
	   if (reqData.Page) {
		   page = reqData.Page;
	   }

	   engine.generateCitation(item, page, reqData.Style, reqData.Locale)
	   		.then(citation => {
				result.Citation = citation;
				resolve(result);
			})
			.catch(citationError => {
				result.Success = false;
				resolve(result);
			});
	});
}

function _generateBibliography(reqData) {
	return new Promise((resolve, reject) => {
		let itemsList = null;

		const result = {
			Success: true,
			Bibliography: null,
			Citations: null
		};

		if (!reqData || !(itemsList = items.buildItemsFromRequest(reqData))) {
			result.Success = false;
			resolve(result);
			return;
		}

		if (!itemsList.length) {
			resolve(result);
			return;
		}

		 //set default style and language, if needed
		if (!reqData.Style) {
			reqData.Style = config.defaults.style;
		}
		if (!reqData.Locale) {
			reqData.Locale = config.defaults.locale;
		}

		engine.generateBibliography(itemsList, reqData.Style, reqData.Locale)
			.then(bib => {
				result.Bibliography = bib.Bibliography || null;
                result.Citations = bib.Citations || null;
				resolve(result);
			})
			.catch(bibError => {
				result.Success = false;
				resolve(result);
			});
	});
}

function _processJsonRequest(request, response, processor) {
	if (!request.is('application/json') || !request.is('json')) {
		_badRequest(response);
		return;
	}

	let reqDataString = '';
	request.on('data', function(chunk) {
		reqDataString += chunk;
	});

	request.on('end', function() {
		request.removeAllListeners('data');
		request.removeAllListeners('end');

		const reqData = JSON.parse(reqDataString);
	   	processor(reqData).then(result => {
			_writeJson(response, result);
	   	});
	});
}

server.get('/citations/available-styles', function(request, response) {
	_getAvailableStyles()
		.then(result => {
			_writeJson(response, result);
		});
});

server.get('/citations/available-locales', function(request, response) {
	_getAvailableLocales()
		.then(result => {
			_writeJson(response, result);
		});
});

server.post('/citations/create', function(request, response) {
	_processJsonRequest(request, response, _generateCitation);
});

server.post('/citations/create-bibliography', function(request, response) {
	_processJsonRequest(request, response, _generateBibliography);
});

process.once('exit', function() {
	engine.cleanupEngine();
});

server.listen(process.env.PORT || config.debug.port);