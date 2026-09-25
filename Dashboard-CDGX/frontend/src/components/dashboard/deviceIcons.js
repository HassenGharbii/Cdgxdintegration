import {
  faVideo,
  faServer,
  faWifi,
  faNetworkWired,
  faHardDrive,
  faShieldHalved,
  faEthernet,
} from '@fortawesome/free-solid-svg-icons';

export const TYPE_ICONS = {
  'Caméra': faVideo,
  'Serveur': faServer,
  'Borne Wi-Fi': faWifi,
  'Routeur': faNetworkWired,
  'NVR': faHardDrive,
  'Pare-feu': faShieldHalved,
  'Switch': faEthernet,
};

export const FALLBACK_ICON = faNetworkWired;
