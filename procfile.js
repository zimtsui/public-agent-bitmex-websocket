'use strict';
const { autoExitDecorator } = require('autonomous');
const { PublicAgentBitmexWebsocket } = require('./');

module.exports = (pandora) => {

    pandora
        .process('process1')
        .scale(1)
        .env({
            NODE_ENV: pandora.dev ? 'development' : 'production',
        });

    pandora
        .service(
            'public-agent-bitmex-websocket',
            autoExitDecorator(3000)(PublicAgentBitmexWebsocket),
        ).process('process1');

    /**
     * you can also use cluster mode to start application
     */
    // pandora
    //   .cluster('./.');

    /**
     * you can create another process here
     */
    // pandora
    //   .process('background')
    //   .nodeArgs(['--expose-gc']);

    /**
     * more features please visit our document.
     * https://github.com/midwayjs/pandora/
     */

};