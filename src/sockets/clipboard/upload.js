const path = require('path');
const Siofu = require('socketio-file-upload');
const fileType = require('file-type');
const readChunk = require('read-chunk');
const logger = require('winston');

function initUploadSocket(socket, onUpload) {
	const uploader = new Siofu();
	uploader.dir = 'uploads';
	uploader.listen(socket);
	uploader.on('start', (event) => {
		logger.debug(`upload started ${event.file.name}`);
	});

	uploader.on('saved', (event) => {
		onUpload(event.file);
	});

	uploader.on('error', (event) => {
		logger.error(event);
	});

	return uploader;
}

const callback = socket => (uploadedFile) => {
	const { user, course } = socket.meta;
	const file = {
		file: path.basename(uploadedFile.pathName),
		name: uploadedFile.name,
		sender: user && user.name,
		src: `${uploadedFile.meta.url}/clipboard/uploads/${path.basename(uploadedFile.pathName)}`,
		type: fileType(readChunk.sync(uploadedFile.pathName, 0, 4100)),
		// eslint-disable-next-line no-plusplus
		id: ++course.lastId,
	};
	if (!uploadedFile.meta.deskType || !uploadedFile.meta.desk) return;
	const desk = course.desks[uploadedFile.meta.deskType][uploadedFile.meta.desk];
	if (!desk) return;
	desk.media.push(file);
	course.broadcastUpdate('desks');
};

module.exports = (socket) => {
	initUploadSocket(socket, callback(socket));
};
