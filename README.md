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

### Excluded Logs

The following logs have been excluded because for more accurate readings they will need custom additive implementations.

```json
[
  {
    "PhraseName": "TribeMemberClaimed",
    "Pattern": "claimed"
  },
  {
    "PhraseName": "TribeMemberUnclaimed",
    "Pattern": "unclaimed"
  },
  {
    "PhraseName": "TekSensorEnemyDino",
    "Pattern": "enemy dino."
  },
  {
    "PhraseName": "TekSensorEnemyPlayer",
    "Pattern": "enemy survivor."
  },
  {
    "PhraseName": "TekSensorWildDino",
    "Pattern": "triggered by something."
  },
  {
    "PhraseName": "TekSensorFriendlySurvivor",
    "Pattern": "friendly survivor."
  },
  {
    "PhraseName": "TribeMemberInvited",
    "Pattern": "was added to the Tribe by"
  },
  {
    "PhraseName": "TribeMemberRankChanged",
    "Pattern": "set to Rank Group"
  },
  {
    "PhraseName": "TribeMemberAdminPromoted",
    "Pattern": "was promoted to a Tribe Admin by"
  },
  {
    "PhraseName": "TribeMemberKicked",
    "Pattern": "was removed from the Tribe!"
  }
]
```
