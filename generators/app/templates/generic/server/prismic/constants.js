// For all COMMON_* sections you can define basic type names
// like 'navbar', 'footer', 'news_detail' etc. In this situation 
// all data for type will be fetched. You can also point only portion
// of data to be fetched for given type. To do so define type this way:
// 'news_detail["uid","tags","name"]'. 
// In this case 'news_detail' type will be fetched with "uid","tags","name" only
const COMMON_DOCUMENTS = ['navbar', 'footer' /*, cookie_message */]

// Define all the common repeatable documents that are only for some pages
// This way we only load for pages that needs it
const COMMON_DOCUMENTS_FOR_BLOCK_LISTED = [
  /*
    'news_detail',
    'news_detail["uid","tags","name"]'
  */
]

const COMMON_DOCUMENTS_FOR_TYPE_LISTED = [
  /*
    'news_detail["uid","tags","name"]'
  */
]

const COMMON_DOCUMENTS_FOR_BLOCK = {
  /*
    news_block: ['news_detail']
  */
}

const COMMON_DOCUMENTS_FOR_TYPE = {
  /*
    news: ['news_detail']
  */
}

// Repeatable documents that are Pages
const COMMON_REPEATABLE_DOCUMENTS = [
  'page'
  /*,
    'news_detail'
  */
]

// Listed of all possible common documents
const ALL_COMMON_DOCUMENTS = COMMON_DOCUMENTS.concat(
  COMMON_DOCUMENTS_FOR_BLOCK_LISTED
).concat(COMMON_DOCUMENTS_FOR_TYPE_LISTED)

// Here is the map to the proper language key in Prismic
// If using a different language from the ones below, add also here the Prismic lang version to its small one as a key
const LANGS_PRISMIC = {
  de: 'de-de',
  en: 'en-us',
  fr: 'fr-fr',
  at: 'de-at',
  ch: 'de-ch',
  es: 'es-es',
  it: 'it-it',
  nl: 'nl-nl',
  gr: 'el-gr',
  pt: 'pt-pt',
  pl: 'pl',
  cz: 'cs-cz',
  sk: 'sk',
  hr: 'hr',
  ru: 'ru',
  hu: 'hu',
  ro: 'ro',
  sl: 'sl',
  tr: 'tr',
  jp: 'ja-jp',
  kr: 'ko-kr',
  cn: 'zh-cn',
  ar: 'es-ar',
  br: 'pt-br',
  mx: 'es-mx',
  au: 'en-au'
}

const PRISMIC_PER_PAGE = 100

// Init env variables using dotenv if we don't have them in process context
if (!(process.env.CONTENT_API_URL && process.env.CONTENT_API_TOKEN)) {
  require('dotenv').config()
}

// Check if we have the proper data to connect to prismic
if (!process.env.CONTENT_API_URL || !process.env.CONTENT_API_TOKEN) {
  throw new Error(
    'Please provide CONTENT_API_TOKEN and CONTENT_API_URL variables from Prismic'
  )
}

module.exports = {
  ALL_COMMON_DOCUMENTS,
  COMMON_DOCUMENTS,
  COMMON_DOCUMENTS_FOR_BLOCK_LISTED,
  COMMON_DOCUMENTS_FOR_BLOCK,
  COMMON_DOCUMENTS_FOR_TYPE_LISTED,
  COMMON_DOCUMENTS_FOR_TYPE,
  COMMON_REPEATABLE_DOCUMENTS,
  LANGS_PRISMIC,
  PRISMIC_PER_PAGE,
  CONTENT_API_URL: process.env.CONTENT_API_URL,
  CONTENT_API_TOKEN: process.env.CONTENT_API_TOKEN,
  DELAY_API_CALLS: process.env.DELAY_API_CALLS,
  EXPORT: process.env.EXPORT
}