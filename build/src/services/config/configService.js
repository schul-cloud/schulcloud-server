const { Configuration } = require('@hpi-schul-cloud/commons');
const { authenticate } = require('@feathersjs/authentication');
const { superheroAccess } = require('./hooks');
/**
 * Should not open for external request only for SC internal micro services.
 */
const configServiceHooks = {
    before: {
        all: [authenticate('jwt'), superheroAccess],
        find: [],
    },
    after: {
        all: [],
        find: [],
    },
};
/**
 * This service resolve configuration for extern services for example shd.
 */
class ConfigService {
    setup(app) {
        this.app = app;
    }
    find() {
        // secrets are save
        return Configuration.toObject();
    }
}
module.exports = {
    configServiceHooks,
    ConfigService,
};
//# sourceMappingURL=configService.js.map