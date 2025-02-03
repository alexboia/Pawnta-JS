const constants = require('./constants.js');
let crItemId = 1;

function _generateNewItemId() {
	if (crItemId < Number.MAX_VALUE) {
		crItemId ++;
	} else {
		crItemId = 1;
	}
	return crItemId;
}

function _getItemTypeFromCode(typeCode) {
	switch (typeCode) {
		case constants.DOCUMENT_TYPES.BOOK:
			return 'book';
		case constants.DOCUMENT_TYPES.ARTICLE:
			return 'article-magazine';
	}
	return null;
}

function _isBookDataValid(bookData) {
	return (!!bookData 
		&& !!bookData.DocumentId 
		&& !!bookData.DocumentTitle 
		&& !!bookData.DocumentType 
		&& !!bookData.SerialNumber 
		&& !!bookData.SerialNumberType)
}

function buildItemFromRequest(reqData) {
	/**
	 * Expected item structure: and how they relate to CSL item properties
	 * - 
	 */

	var bookData = reqData.Book || null;
	if (!_isBookDataValid(bookData)) {
		return null;
	}

	var itemType = _getItemTypeFromCode(bookData.DocumentType)
	if (!itemType) {
		return null;
	}

	const itemId = 'ITEM-' 
		+ bookData.DocumentId + '-' 
		+ _generateNewItemId();

	var item = {
		'id': itemId,
		'title': bookData.DocumentTitle,
		'type': itemType,
		'author': [],
		'issued': {
			'date-parts': []
		}
	};

	if (bookData.PublisherName != undefined && bookData.PublisherName) {
		item['publisher'] = bookData.PublisherName;
	}
	if (bookData.PublishingPlaceName != undefined && bookData.PublishingPlaceName) {
		item['publisher-place'] = bookData.PublishingPlaceName;
	}
	if (bookData.CollectionTitle != undefined && bookData.CollectionTitle) {
		item['collection-title'] = bookData.CollectionTitle;
	}
	if (itemType == 'article-magazine') {
		if (bookData.MagazineTitle != undefined && bookData.MagazineTitle) {
			item['container-title'] = bookData.MagazineTitle;
		}
		if (bookData.FromPage != undefined && bookData.ToPage != undefined) {
			var fromPage = parseInt(bookData.FromPage);
			var toPage = parseInt(bookData.ToPage);
			if (!isNaN(fromPage) && !isNaN(toPage) && fromPage > 0 && toPage > 0) {
				item['page'] = fromPage + '-' + toPage;
			}
		}
	}
	if (bookData.Note != undefined && bookData.Note) {
		item['note'] = bookData.Note;
	}

	if (bookData.SerialNumber) {
		if (bookData.SerialNumberType == 'ISBN') {
			item['ISBN'] = bookData.SerialNumber;
		} else if (bookData.SerialNumberType == 'ISSN') {
			item['ISSN'] = bookData.SerialNumber;
		}
	}

	if (bookData.Authors && bookData.Authors.length) {
		for (var i = 0; i < bookData.Authors.length; i ++) {
			var author = bookData.Authors[i];
			if (!author.FirstName || !author.LastName) {
				continue;
			}
			item.author.push({
				'given': author.LastName,
				'family': author.FirstName
			});
		}
	}

	if (bookData.PublicationYear && !isNaN(parseInt(bookData.PublicationYear))) {
		item.issued['date-parts'].push([bookData.PublicationYear]);
	}

	return item;
}

function buildItemsFromRequest(reqData) {
	if (!reqData 
		|| !reqData.Items 
		|| !reqData.Items.hasOwnProperty('length')) {
		return null;
	}

	const items = [];

	for (var i = 0; i < reqData.Items.length; i ++) {
		const reqItem = reqData.Items[i];
		const page = reqItem.Page ? reqItem.Page : null;
		let itemId = reqItem.Id ? reqItem.Id : null;

		const item = buildItemFromRequest(reqItem);	

		if (!itemId) {
			itemId = item['id'];
		}
		
		if (!itemId) {
			continue;
		}
		
		if (item) {
			items.push({
				Page: page,
				Data: item,
				Id: itemId
			});
		}
	}

	return items;
}

exports.buildItemFromRequest = buildItemFromRequest;
exports.buildItemsFromRequest = buildItemsFromRequest;