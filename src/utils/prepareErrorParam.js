/**
 * This is to pass errors as second parameter in feather errors that it is write in .data = <myError>.
 * The problem by errors is, that they have not iterable keys. But feathers want to iterate all second + param inputs.
 *	message { value: 'test',
 *		writable: true,
 *		enumerable: false, <-- problem
 *		configurable: true }
 * But to call the value directly is no problem.
 * @param {*} err - Can handle generic errors, errors with new Error, or new <featherError>, null and undefined
 * @example throw new Forbidden('Message', prepareErrorParam(err));
 */
const prepareErrorParam = (err) => (!err ? err : ({
	code: err.code,
	stack: err.stack,
	message: err.message,
	className: err.className,
	name: err.name,
	data: err.data,
	type: err.type,
}));

// TODO: try catch ?
/* for tests
		try {
			// throw new Error('bla bla');
			// const res = null.forEach((r) => r);
			throw new GeneralError('Can\'t find connected school.');
		} catch (err) {
			throw new Forbidden('Message', prepareErrorParam(err));
        }
*/

module.exports = prepareErrorParam;
