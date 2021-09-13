# Tribe Logger

### key_phrases.json

This file contains a collection of phrases that can searched for in ark's tribe logs.

> This file would be retrieved from the server once apon authentication.
>
> > How would updates made remotely make there way to the client side application?

#### QueryString

`String` that is used in the `fuzzy string searching` when trying to determine the phrase type.

#### Enabled

`Boolean` that determines whether the phrase should be included in `fuzzy string searches`. This value
is determined via the settings set on the remote server when the request to `key_phrases.json` is made.
