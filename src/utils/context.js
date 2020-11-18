const { AsyncLocalStorage } = require('async_hooks');
const { ObjectId } = require('mongoose').Types;
const { warning } = require('../logger');
const { ApplicationError } = require('../errors');

// requires Node.js 14
const asyncLocalStorage = new AsyncLocalStorage();

/**
 * This class is used for the BL context.
 * All metadata added into the context should be defined in this class with a getter
 * and setter and documented return types.
 *
 * All getters may return undefined which
 * must be handled in the execution context.
 *
 * Do NOT add data into the context which may change during execution!
 * Sample: User-data may change. If adding the whole user, you  must take care to invalidate the data in the context if it changes.
 */
class Context {
	constructor({ requestId, app, authenticatedUser = { userId: undefined, accountId: undefined, roles: undefined } }) {
		this.requestId = requestId;
		this.app = app;
		this.setAuthenticatedUser(authenticatedUser);
	}

	/**
	 * Returns the feathers/express app. Try to replaces access to the app using a use case facade.
	 * @deprecated access the app only for legacy reasons to services not having a use case facade implemented.
	 */
	getApp() {
		return this.app;
	}

	/**
	 * Contains information like JWT for authenticated users.
	 */
	getAuthenticatedUser() {
		return this.authenticatedUser;
	}

	setAuthenticatedUser(authenticatedUser = { userId: undefined, accountId: undefined, roles: undefined }) {
		this.authenticatedUser = authenticatedUser;
	}

	/**
	 * A request may have an id added via request header from an external application. It can be used to relate issues over different components.
	 * @returns {(string|undefined)} requestId
	 */
	getRequestId() {
		return this.requestId;
	}

	/**
	 * A initiator by default is REST when the context was created during a request. This might be different if a batch/job has been executed.
	 * @returns {(string|undefined)} initiator
	 */
	getInitiator() {
		return this.initiator;
	}
}

const isValidId = (id) => {
	return ObjectId.isValid(id);
};

const createId = () => {
	return ObjectId().toString();
};

/**
 * Returns an instance of the current context. Requires an initialized context.
 * @returns {Context} returns current context
 */
const getContext = () => {
	const store = asyncLocalStorage.getStore();
	if (store === undefined) {
		throw new ApplicationError('context has not been defined or is lost');
	}
	return store;
};

/**
 * Initializes an context object which can be retieved later via getContext.
 * @param {Context} ctx Object to be assigned as context
 * @param {*} callback next (middleware)
 */
const runContext = (ctx, callback) => {
	asyncLocalStorage.run(ctx, callback);
};

/**
 * Initializes Context as request middleware.
 */
const runContextMiddlewareInit = (req, res, next) => {
	let requestId = req.get('requestId');
	if (!requestId) {
		requestId = createId();
	} else if (requestId && !isValidId(requestId)) {
		warning('an invalid request id has been defined in request headers, which will be overriden to', requestId);
		requestId = createId();
	}
	res.set('requestId', requestId);
	const ctx = new Context({ requestId, app: req.app });
	runContext(ctx, next);
};

module.exports = {
	runContextMiddlewareInit,
	runContext,
	getContext,
};
