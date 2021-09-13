import path from 'path';
import fs from 'fs';
import yaml from 'js-yaml';

interface KeyPhrases {
  enemy_dino: {
    killed: string;
  };
  enemy_player: {
    killed: string;
  };
  tribe_member: {
    invited: string;
    rank_changed: string;
    admin_promoted: string;
    kicked: string;
    podded: string;
    demolished: string;
    tamed: string;
    claimed: string;
    unclaimed: string;
  };
  tek_sensor: {
    enemy_dino: string;
    enemy_player: string;
    wild_dino: string;
    friendly_survivor: string;
  };
  meta: {
    count: number;
  };
}

export enum PhraseType {
  EnemyDinoKilled = 0,
  EnemyPlayerKilled,
  TribeMemberInvited,
  TribeMemberRankChanged,
  TribeMemberAdminPromoted,
  TribeMemberKicked,
  TribeMemberPodded,
  TribeMemberDemolished,
  TribeMemberTamed,
  TribeMemberClaimed,
  TribeMemberUnclaimed,
  TekSensorEnemyDino,
  TekSensorEnemyPlayer,
  TekSensorWildDino,
  TekSensorFriendlySurvivor,
}

export default class KeyPhraser {
  // phraseCollection = new Map<PhraseType, string>();

  keyPhrases: KeyPhrases;

  count: number;

  constructor(phrases: KeyPhrases) {
    this.keyPhrases = phrases;
    this.count = phrases.meta.count;
    // eslint-disable-next-line no-restricted-syntax
    // for (const [, valueGroup] of Object.entries(this.keyPhrases)) {
    //   // eslint-disable-next-line no-restricted-syntax
    //   for (const [, value] of Object.entries(valueGroup)) {
    //     this.phraseCollection.set();
    //   }
    // }
  }

  /**
   * Creates a new KeyPhraser.
   * @returns A new initialized KeyPhraser object unless it failed to find the startup .yaml file.
   */
  static getDefaultKeyPhraser(): KeyPhraser | null {
    // Get Phases
    try {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const phrases: KeyPhrases = yaml.load(
        fs.readFileSync(
          path.join(__dirname, '../../key_phrases_static_only.yaml'),
          'utf8'
        )
      );
      return new KeyPhraser(phrases);
    } catch (e) {
      console.log(e);
      return null;
    }
  }

  getPhrasePattern(type: PhraseType): string {
    switch (type) {
      // Enemy Dino
      case PhraseType.EnemyDinoKilled:
        return this.keyPhrases.enemy_dino.killed;
      // Enemy Player
      case PhraseType.EnemyPlayerKilled:
        return this.keyPhrases.enemy_player.killed;
      // Tribe Member
      case PhraseType.TribeMemberInvited:
        return this.keyPhrases.tribe_member.invited;
      case PhraseType.TribeMemberRankChanged:
        return this.keyPhrases.tribe_member.rank_changed;
      case PhraseType.TribeMemberAdminPromoted:
        return this.keyPhrases.tribe_member.admin_promoted;
      case PhraseType.TribeMemberKicked:
        return this.keyPhrases.tribe_member.kicked;
      case PhraseType.TribeMemberPodded:
        return this.keyPhrases.tribe_member.podded;
      case PhraseType.TribeMemberDemolished:
        return this.keyPhrases.tribe_member.demolished;
      case PhraseType.TribeMemberTamed:
        return this.keyPhrases.tribe_member.tamed;
      case PhraseType.TribeMemberClaimed:
        return this.keyPhrases.tribe_member.claimed;
      case PhraseType.TribeMemberUnclaimed:
        return this.keyPhrases.tribe_member.unclaimed;
      // Tek Sensor
      case PhraseType.TekSensorEnemyDino:
        return this.keyPhrases.tek_sensor.enemy_dino;
      case PhraseType.TekSensorEnemyPlayer:
        return this.keyPhrases.tek_sensor.enemy_player;
      case PhraseType.TekSensorWildDino:
        return this.keyPhrases.tek_sensor.wild_dino;
      case PhraseType.TekSensorFriendlySurvivor:
        return this.keyPhrases.tek_sensor.friendly_survivor;
      default:
        throw new Error('Given phrase to KeyPraser did not match any cases');
    }
  }
}
