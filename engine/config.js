exports.config ={
    engine: {
        cache: {
            stylesSize: 5,
            localesSize: 5,
            enginesSize: 5
        }
    },
    csl: {
        defsPath: './data/csl-defs',
        localesPath: './data/csl-locales'
    },
    defaults: {
        style: 'apa',
        locale: 'en-US'
    },
    debug: {
        port: 80
    }
};