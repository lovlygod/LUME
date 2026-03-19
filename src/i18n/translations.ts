import en from './locales/en.json';
import ru from './locales/ru.json';
import zh from './locales/zh.json';
import es from './locales/es.json';
import ptBR from './locales/pt-BR.json';

export const translations = {
  en,
  ru,
  zh,
  es,
  'pt-BR': ptBR
};

export type Language = 'ru' | 'en' | 'zh' | 'es' | 'pt-BR';
type TranslationParamValue = string | number | boolean;
interface TranslationNode {
  [key: string]: TranslationNode | string;
}

// Flatten nested translation objects for easy access with dot notation
function flattenObject(obj: TranslationNode, prefix = ''): Record<string, string> {
  const result: Record<string, string> = {};
  
  for (const key in obj) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    const value = obj[key];
    if (typeof value === 'object' && value !== null) {
      Object.assign(result, flattenObject(value, fullKey));
    } else if (typeof value === 'string') {
      result[fullKey] = value as string;
    }
  }
  
  return result;
}

// Create flat translations for backward compatibility
const flatTranslations = {
  ru: flattenObject(ru),
  en: flattenObject(en),
  zh: flattenObject(zh),
  es: flattenObject(es),
  'pt-BR': flattenObject(ptBR)
};

// Also keep original nested structure for namespaced access
export const nestedTranslations = translations;

// Support both old flat keys (settingsTitle) and new namespaced keys (settings.title)
const keyMapping: Record<string, string> = {
  // Settings
  'settingsTitle': 'settings.title',
  'settingsSubtitle': 'settings.subtitle',
  'appearance': 'settings.appearance',
  'theme': 'settings.theme',
  'themeDescription': 'settings.themeDescription',
  'dark': 'settings.dark',
  'light': 'settings.light',
  'privacy': 'settings.privacy',
  'postPrivacy': 'settings.postPrivacy',
  'postPrivacyDescription': 'settings.postPrivacyDescription',
  'public': 'settings.public',
  'followersOnly': 'settings.followersOnly',
  'messagePrivacy': 'settings.messagePrivacy',
  'messagePrivacyDescription': 'settings.messagePrivacyDescription',
  'everyone': 'settings.everyone',
  'saveChanges': 'settings.saveChanges',
  'saving': 'settings.saving',
  'settingsSaved': 'settings.saved',
  'settingsSaveError': 'settings.saveError',
  'snowEffect': 'settings.snowEffect',
  'snowEffectDescription': 'settings.snowEffectDescription',
  'dangerZone': 'settings.dangerZone',
  'deleteAccount': 'settings.deleteAccount',
  'deleteAccountSuccess': 'settings.deleteAccountSuccess',
  'deleteAccountError': 'settings.deleteAccountError',
  'deleting': 'settings.deleting',
  'common.cancel': 'common.cancel',
  
  // Profile
  'signals': 'profile.signals',
  'signal': 'profile.signal',
  'followers': 'profile.followers',
  'following': 'profile.following',
  'follow': 'profile.follow',
  'message': 'profile.message',
  'editProfile': 'profile.editProfile',
  'cancel': 'common.cancel',
  'save': 'common.save',
  'name': 'profile.name',
  'username': 'profile.username',
  'bio': 'profile.bio',
  'city': 'profile.city',
  'website': 'profile.website',
  'joined': 'profile.joined',
  'noBio': 'profile.noBio',
  'noSignals': 'profile.noSignals',
  'firstSignal': 'profile.firstSignal',
  'viewNow': 'feed.viewNow',
  
  // Messages
  'selectChat': 'messages.selectChat',
  'chooseConversation': 'messages.chooseConversation',
  'noConversations': 'messages.noConversations',
  'send': 'messages.send',
  'sending': 'messages.sending',
  'sendMessage': 'messages.sendMessage',
  'fileUploaded': 'messages.fileUploaded',
  'fileUploadError': 'messages.fileUploadError',
  'messageSent': 'messages.messageSent',
  'messageSendError': 'messages.messageSendError',
  'messageDeleted': 'messages.messageDeleted',
  'deleteForMe': 'messages.deleteForMe',
  'deleteForEveryone': 'messages.deleteForEveryone',
  'deletedForYou': 'messages.deletedForYou',
  'messageDeletedText': 'messages.messageDeletedText',
  'online': 'time.online',
  'lastSeen': 'time.lastSeen',
  'typing': 'time.typing',
  
  // Auth
  'login': 'navigation.login',
  'register': 'navigation.register',
  'email': 'auth.email',
  'password': 'auth.password',
  'confirmPassword': 'auth.confirmPassword',
  'signIn': 'auth.signIn',
  'signUp': 'auth.signUp',
  'noAccount': 'auth.noAccount',
  'hasAccount': 'auth.hasAccount',
  'loginError': 'auth.loginError',
  'registerError': 'auth.registerError',
  'usernameError': 'auth.usernameError',
  'passwordError': 'auth.passwordError',
  'passwordMismatch': 'auth.passwordMismatch',
  'welcomeBack': 'auth.welcomeBack',
  'enterEmail': 'auth.enterEmail',
  'enterPassword': 'auth.enterPassword',
  'authenticating': 'auth.authenticating',
  'joinNetwork': 'auth.joinNetwork',
  'enterName': 'auth.enterName',
  'chooseUsername': 'auth.chooseUsername',
  'createPassword': 'auth.createPassword',
  'confirmPasswordPlaceholder': 'auth.confirmPasswordPlaceholder',
  'creatingAccount': 'auth.creatingAccount',
  'createAccount': 'auth.createAccount',
  
  // Logout
  'logoutTitle': 'logout.title',
  'logoutConfirm': 'logout.confirm',
  'logoutCancel': 'logout.cancel',
  
  // Common
  'loading': 'common.loading',
  'error': 'common.error',
  'success': 'common.success',
  'delete': 'common.delete',
  'edit': 'common.edit',
  'close': 'common.close',
  'back': 'common.back',
  'next': 'common.next',
  'search': 'common.search',
  'noResults': 'common.noResults',
  
  // Navigation
  'home': 'navigation.home',
  'explore': 'navigation.explore',
  'messages': 'navigation.messages',
  'profile': 'navigation.profile',
  'verified': 'navigation.verified',
  'settings': 'navigation.settings',
  'logout': 'navigation.logout'
};

export function getTranslation(language: Language, key: string, params?: Record<string, TranslationParamValue>): string {
  let result: string | null = null;
  
  // First try direct access (for namespaced keys like settings.title)
  const keys = key.split('.');
  let value: TranslationNode | string | undefined = translations[language] as TranslationNode;
  
  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k] as TranslationNode | string;
    } else {
      value = undefined;
      break;
    }
  }
  
  if (typeof value === 'string') {
    result = value;
  }
  
  // Try key mapping for backward compatibility if not found
  if (result === null && key in keyMapping) {
    const mappedKey = keyMapping[key];
    return getTranslation(language, mappedKey, params);
  }
  
  // Try flat translations if not found
  if (result === null && key in flatTranslations[language]) {
    result = flatTranslations[language][key];
  }
  
  // Fallback to English if not found
  if (result === null && key in flatTranslations.en) {
    result = flatTranslations.en[key];
  }
  
  // Last resort - try English with mapped key
  if (result === null && key in keyMapping) {
    const mappedKey = keyMapping[key];
    const mappedKeys = mappedKey.split('.');
    value = translations.en as TranslationNode;
    for (const k of mappedKeys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k] as TranslationNode | string;
      } else {
        return key;
      }
    }
    result = typeof value === 'string' ? value : key;
  }
  
  // If still null, return key
  if (result === null) {
    return key;
  }
  
  // Handle parameter interpolation
  if (params && Object.keys(params).length > 0) {
    Object.keys(params).forEach(paramKey => {
      const paramValue = String(params[paramKey]);
      result = result!.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), paramValue);
    });
  }
  
  return result;
}
