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
    },
    apiKey: 'CSLoOMW8MwqWRAxjN3lgmNAMFTI3WC5XqwxIUOlGn9C51K1ePuJqSQOqHGR9PPbn82yNg6sPFb6vvqqkL0gKIX8ivWCmWAYbsC9HMGxNjjibYzR1zJwe29qIY8h6ibGe'
};