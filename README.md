# Pawnta-JS
A [citeproc-js](https://github.com/Juris-M/citeproc-js/tree/master) based small [CSL](https://citationstyles.org/) citation server 
(the name of the thing has nothing to do with the function of the thing; it's a romanian inside joke).

## Why, what
Uncle Bob says that practicing should be part of any professional's daily routine, or something like that.
At any rate, the idea is that any professional should practice and he goes on and talks about katas.
It *is* a good idea, but practicing in such isolated manner doesn't really work for me, my mind sort of goes blank and I move on to actually useful (or productive, if you will) stuff.
So, my take on the matter is to either do small projects or go through older ones, try to get them up and running again and perform some cleanup work.

Now... this was actually a application which I have used to support a larger eco-system, it was only internal facing. 
Its purpose was to generate citations and bibliographies based on the [CSL](https://citationstyles.org/) language and using the citeproc-js processor to do the heavy-lifting.
As you probably guessed, it's a NodeJs application with a very simple JSON-based API.

In effect, it is merely a thin (but highly effective) wrapper which I wrote some ten years ago and the purpose of this exercise was to:
- configure it to run again;
- refactor it;
- use updated dependencies.

## Runtime environment
The original one ran in an IIS environment, so the first step is to configure the environment:
- download iisnode from [here](https://github.com/Azure/iisnode/releases/tag/v0.2.26) and install it;
- download URL Rewrite module form [here](https://www.iis.net/downloads/microsoft/url-rewrite) and install it.

Note: 
The `interceptor.js` file shipped with iisnode will issue the following warning:
```
DeprecationWarning: Buffer() is deprecated due to security and usability issues. Please use the Buffer.alloc(), Buffer.allocUnsafe(), or Buffer.from() methods instead.
```

So, at around line 169 (for the x64 one at least), replace the `new Buffer()` call with: `Buffer.alloc(data, typeof encoding === 'string' ? encoding : 'utf8')`.

For whatever it's worth, although originally built for IIS 7 and IIS 8, it works just fine with IIS 10 as well, on Windows 11.

## Debugging
You might want to adjust this section from the workspace file to suit your needs:

```
"launch": {
		"configurations": [
			{
				"type": "node",
				"name": "DEBUG IIS NODE",
				"request": "attach",
				"localRoot": "[... change here...]",
				"remoteRoot": "[...change here...]"
			}
		]
	}
```

## Public API
- `GET /citations/available-styles` to get a list of available styles as a list of key-label pairs
- `GET /citations/available-locales` to get a list of available locales as simple keys
- `POST /citations/create` to create a citation for a single item
- `POST /citations/create-bibliography` to create a bibliography for a collection of items

Please see the  `data/csl-test-requests` directory for sample requests.

## Styles and locales
The project includes styles and locales data files (`data/csl-defs` and `data/csl-locales` respectively), taken from:

- styles: https://github.com/citation-style-language/styles
- locales: https://github.com/citation-style-language/locales

Also please see [the main website on Citation Style Language](https://citationstyles.org/).

The folders can be configured to reside somewhere else; please see `engine/config.js`.

## Web server configuration
See `web.config` for iisnode, URL rewriting and access restrictions to various folders.

## Security
Since it was design as an internal facing application, it was never exposed outside the network.
It only has an API key authorization and the API Key is stored in `engine/config.js`.
The API key is looked for in the `x-api-key` header (first) and the `apiKey` query string parameter (second).

## Other notes
See [here the official guide on using citeproc-js](https://citeproc-js.readthedocs.io/en/latest/setting-up.html).

## What's next
Nothing, lest I need it at some point and I find that something's wrong with it. 
It was just target practice with bragging rights, albeit one that I hope will help somebody else.
Obviously, this shouldn't stop you from buying me some coffee.

[![ko-fi](https://www.ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/Q5Q01KGLM)