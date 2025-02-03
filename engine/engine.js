const fs = require('fs');
const { LRUCache } = require('lru-cache');
const sax = require('sax');
const config = require('./config.js').config;
const cslSys = require('./csl_sys.js');
const cslWrapper = require('./csl_wrapper.js');
const CSL = require('./processor/citeproc_commonjs.js');
const constants = require('./constants.js');
const HTML = require('./engine.format.html.js').HTML;

//Cache available files and locales
var availableStyles = null;
var availableLocales = null;

//Cache style info, locales info and engines
//	in a LRU cache... it's been the most optimal approach for us
var stylesCache = new LRUCache({
	max: config.engine.cache.stylesSize,
	length: function(value) {
		return 1;
	}
});

var localesCache = new LRUCache({
    max: config.engine.cache.localesSize,
    length: function(item) {
        return 1;
    }
});

var enginesCache = new LRUCache({
    max: config.engine.cache.enginesSize,
    length: function(item) {
        return 1;
    },
    dispose: function(key, item) {
        item.dispose();
    }
});

function constructStylePath(name) {
    return config.csl.defsPath + '/' + name + '.csl';
}

function constructLocalePath(name) {
    return config.csl.localesPath + '/locales-' + name + '.xml';
}

function getStyleInfo(fielName) {
	return new Promise((resolve, reject) => {
		const parser = sax.parser(false);
		const filePath = config.csl.defsPath + '/' + fielName;

		var fileSize = 0;
		var fileCursor = 0;
		var fileHandle = null;

		var processedStyleTitle = false;
		var foundStyleTitle = false;

		var running = true;
		var fileReadAmount = 512;
		var fileReadBuffer = null;		

		function _cleanup(onReady) {
			running = false;

			parser.onerror = null;
			parser.ontext = null;
			parser.onopentag = null;
			parser.onend = null;
			parser.close();

			if (fileHandle) {
				fileHandle.close().finally(() => {
					fileHandle = null;
					onReady();
				});
			}
			
			fileReadBuffer = null;
			fileCursor = 0;
			fileSize = 0;
		}

		function _onFileOpen(fileDescriptor) {
			fileHandle = fileDescriptor;
			//Use of new Buffer() is deprectated
			fileReadBuffer = Buffer.alloc(fileSize);
			fileHandle.read(fileReadBuffer, fileCursor, fileReadAmount, fileCursor)
				.then(_onFileDataRead)
				.catch(_onFileDataReadError);
		}

		function _onFileDataRead(fileReadResult) {
			const bytesRead = fileReadResult.bytesRead;
			if (running) {
				parser.write(fileReadBuffer.toString('utf8', fileCursor, bytesRead));
				fileCursor += bytesRead;
				process.nextTick(_doNextRead);
			}
		}

		function _onFileDataReadError(fileDataReadError) {
			_cleanup(() => {
				reject(fileDataReadError);
			});
		}

		function _doNextRead() {
			if (running && fileHandle) {
				fileHandle.read(fileReadBuffer, fileCursor, fileReadAmount, fileCursor)
					.then(_onFileDataRead)
					.catch(_onFileDataReadError);
			}
		}

		parser.onerror = function(parserError) {
			_cleanup(() => {
				reject(parserError);
			});
		};

		parser.onopentag = function(tag) {
			const name = tag.name 
				? tag.name.toLocaleLowerCase() 
				: null;

			if (name != 'title') {
				return;
			}

			foundStyleTitle = true;
		};
		
		parser.ontext = function(text) {
			if (!foundStyleTitle || processedStyleTitle) {
				return;
			}

			processedStyleTitle = true;
			_cleanup(() => {
				resolve({
					key: fielName.replace('.csl', ''),
					title: text
				});
			});
		};
		
		parser.onend = function() {
			if (!foundStyleTitle || !processedStyleTitle) {
				_cleanup(() => {
					reject(new Error('Title tag not found'));
				});				
			}
		};

		fs.promises.stat(filePath)
			.then(stats => {
				fileSize = stats.size;
				fs.promises.open(filePath, 'r')
					.then(_onFileOpen)
					.catch(openError => {
						_cleanup(() => {
							reject(openError);
						});
					});
			})
			.catch(statError => {
				_cleanup(() => {
					reject(statError);
				});
			});
	});
}

function getAvailableStyles() {
	return new Promise((resolve, reject) => {
		if (availableStyles !== null) {
			resolve(availableStyles);
			return;
		}

		function _allStyleFileNamesRead(fileNames) {
			var allFilesPromises = [];
			fileNames.forEach(fileName => {
				allFilesPromises.push(getStyleInfo(fileName));
			});

			Promise.all(allFilesPromises)
				.then(_allStyleInfosReady)
				.catch(error => {
					availableStyles = null;
					reject(error);
				});
		}

		function _allStyleInfosReady(styleInfos) {
			availableStyles = {};
			styleInfos.forEach(styleInfo => {
				availableStyles[styleInfo.key]  = styleInfo.title;
			});

			resolve(availableStyles);
		}

		fs.promises.readdir(config.csl.defsPath)
			.then(_allStyleFileNamesRead)
			.catch((error) => {
				reject(error)
			});
	});
}

function _buildFriendlyLocaleName(fileName) {
	return fileName.replace('locales-', '').replace('.xml', '');
}

function getAvailableLocales() {
	return new Promise((resolve, reject) => {
		if (availableLocales !== null) {
			resolve(availableLocales);
			return;
		}

		function _allLocaleFileNamesRead(fileNames) {
			availableLocales = [];
			fileNames.forEach(fileName => {
				availableLocales.push(_buildFriendlyLocaleName(fileName));
			});
			resolve(availableLocales);
		}

		fs.promises.readdir(config.csl.localesPath)
			.then(_allLocaleFileNamesRead)
			.catch((error) => {
				reject(error)
			});
	});
}

function _getEngineKey(style, locale) {
	return style + ':' + locale;
}

function _getEngineInstance(styleData, locale) {
	var sys = new cslSys.CSLSys(localesCache, constants.ABBREVIATIONS);
    return new cslWrapper.CSLWrapper(new CSL.Engine(sys, styleData, locale, true));
}

function _loadStyle(name) {
	return new Promise((resolve, reject) => {
		if (stylesCache.has(name)) {
			resolve(stylesCache.get(name));
			return;
		}

		fs.promises.readFile(constructStylePath(name), { encoding: 'utf8' })
			.then(fileData => {
				stylesCache.set(name, fileData);
				resolve(fileData);
			})
			.catch(readError => {
				reject(readError);
			});
	});
}

function _loadLocale(name) {
    return new Promise((resolve, reject) => {
		if (localesCache.has(name)) {
			resolve(localesCache.get(name));
			return;
		}

		fs.promises.readFile(constructLocalePath(name), { encoding: 'utf8' })
			.then(fileData => {
				localesCache.set(name, fileData);
				resolve(fileData);
			})
			.catch(readError => {
				reject(readError);
			});
	});
}

function _createEngine(style, locale) {
	if (CSL.Output.Formats.html != HTML) {
		CSL.Output.Formats.html = HTML;
	}

	return new Promise((resolve, reject) => {
		_loadStyle(style)
			.then(styleData => {
				_loadLocale(locale)
					.then(localeData => {
						let engine = null;
						const engineKey = _getEngineKey(style, locale);

						if (!enginesCache.has(engineKey)) {
							engine = _getEngineInstance(styleData, locale);
							enginesCache.set(engineKey, engine);
						} else {
							engine = enginesCache.get(engineKey);
						}

						resolve(engine);
					})
					.catch(localeError => {
						reject(localeError);
					})
			})
			.catch(styleError => {
				reject(styleError);
			})
	});
}

function generateCitation(item, page, style, locale) {
	return new Promise((resolve, reject) => {
		_createEngine(style, locale)
			.then(engine => {
				const citation = engine.generateCitation(item, page);
				resolve(citation);
			})
			.catch(engineError => {
				reject(engineError);
			});
	});
}

function generateBibliography(items, style, locale) {
	return new Promise((resolve, reject) => {
		_createEngine(style, locale)
			.then(engine => {
				const bibliography = engine.generateBibliography(items);
				resolve(bibliography);
			})
			.catch(engineError => {
				reject(engineError);
			});
	});
}

function cleanupEngine() {
	stylesCache.clear();
	stylesCache = null;

	availableLocales = null;
	availableStyles = null;
}

exports.getAvailableStyles = getAvailableStyles;
exports.getAvailableLocales = getAvailableLocales;
exports.generateCitation = generateCitation;
exports.generateBibliography = generateBibliography;
exports.cleanupEngine = cleanupEngine;