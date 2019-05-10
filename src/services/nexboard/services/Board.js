/* eslint-disable object-curly-newline */
/* eslint-disable class-methods-use-this */

const nexboardClient = require('../utils/Nexboard');

class Board {
	constructor(options) {
		this.options = options || {};
		this.docs = {};
	}

	get(id) {
		return nexboardClient.getBoard(id);
	}

	create({ projectId, title = 'Neues Nexboard Board', description = 'Ein digitales Whiteboard' }, params) {
		return nexboardClient.createBoard(title, description, projectId);
	}

	find(params) {
		return nexboardClient.getBoardsByProject(params.query.projectId);
	}

	setup(app) {
		this.app = app;
	}
}

module.exports = Board;
