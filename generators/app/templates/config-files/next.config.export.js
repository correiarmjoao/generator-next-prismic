const fs = require("fs");
const path = require("path");
const mkdirp = require("mkdirp");

const prismicApi = require("./server/prismic");
const sitemap = require("./server/sitemap");
const { languages } = require("./constants");

/**
 * Routing configuration for export
 * Key: Prismic's type
 * Value: {
 *  routePrefix: prefix to be appended before Prismic's object ID
 *  pagePath: name of file in /pages folder
 *  queryData: name of variable to be passed to container with value of Prismic's object ID
 * }
 *
 * Example config object:
 * {
 *  page: {
 *   routePrefix: '/',
 *   pagePath: '/main'
 *  },
 *  blog_detail: {
 *   routePrefix: '/blog/',
 *   routeFix: 'company/blog', // If belonging to a section simply add it here example: '/company/blog'
 *   pagePath: '/blog_detail',
 *   queryData: 'blog_id'
 *  }
 * }
 */

const TYPE_ROUTES_MAPPING = {
  page: {
    routePrefix: "/",
    pagePath: "/main"
  }
};

/**
 * Helper function for searching for a key for a given value
 */
const getKeyByValue = (object, value) => {
  return Object.keys(object).find(key => object[key] === value);
};

/**
 * Genrerates sitemap.xml file into static folder
 */
const generateSiteMap = () => {
  sitemap(prismicApi);
};

/**
 * Generates redirection files for home page and language homes
 */
const generateRedirectFiles = (outDir) => {

  // Iterate through languages and create redirection files
  languages.map((lang, index) => {
    const fileString = `<!DOCTYPE html><html><head><meta http-equiv="refresh" content="0; url=/${lang}/home" /></head><body></body></html>`;

    // Create folder for given language
    mkdirp.sync(path.join(outDir, `${lang}`), err => {
      console.log(`Creating dir for lang ${lang} error`, err);
    });

    // Write redirection HTML into file
    fs.writeFile(
      path.join(outDir, `${lang}`, "index.html"),
      fileString,
      (err, data) => {
        if (err) {
          console.log(`Generating ${lang} lang redirection file error`, err);
        }
      }
    );

    // Root file
    if (index === 0) {
      // Write redirection HTML into root file
      fs.writeFile(
        path.join(outDir, "index.html"),
        fileString,
        (err, data) => {
          if (err) {
            console.log(`Generating root redirection file error`, err);
          }
        }
      );
    }
  });
  console.log(`Redirection files generated`);
};

const getCommonDocumentsForLang = (lang, commonDocumentsForLangs) => {
  return new Promise((resolve, reject) => {
    prismicApi
      .getDocumentsPage(null, null, null, lang)
      .then(value => {
        commonDocumentsForLangs[lang] = value;
        resolve();
      })
      .catch(e => {
        reject(new Error(`Export failed while fetching common documents data. Error: ${e}`))
      });
  });
};

/**
 * Module's main function which produces path mapping object for next.js
 * export as described at https://github.com/zeit/next.js/#usage
 *
 * Example result object:
 *
 * {
 *   '/de/page': { page: '/main' },
 *   '/de/blog/blog-test': { page: '/blog_detail', query: { blog_id: 'blog-test' } }
 * }
 */
const getMap = async outDir => {
  generateSiteMap();
  generateRedirectFiles(outDir);

  let commonDocumentsForLangs = {};

  await Promise.all(
    languages.map(async lang => {
      await getCommonDocumentsForLang(lang, commonDocumentsForLangs);
      return lang;
    })
  );

  return new Promise((resolve, reject) => {
    const promises = [];
    let result = {};
    languages.forEach(lang => {
      Object.keys(TYPE_ROUTES_MAPPING).forEach((docType, config) => {
        promises.push(
          new Promise((success, failure) => {
            prismicApi.getAllForType(
              null,
              docType,
              prismicApi.LANGS_PRISMIC[lang],
              success,
              failure,
              1
            );
          })
        );
      });
    });

    Promise.all(promises)
      .then(values => {
        values.map(group => {
          group.map(item => {
            const lang = getKeyByValue(prismicApi.LANGS_PRISMIC, item.lang);
            const adjustedPath = item.uid.replace(
              /(-(<%- languages.map(lang => `${lang}`).join('|') %>))$/,
              ""
            );
            const sectionUrl =
              item.data.url_section && item.data.url_section.trim().length > 0
                ? item.data.url_section
                : null;
            let outPath = `${outDir}/${lang}/${
              sectionUrl ? `${sectionUrl}/` : ""
              }${adjustedPath}`;

            const fix404 = adjustedPath === "404";

            // If custom type of page, adjust the path
            if (TYPE_ROUTES_MAPPING[item.type] && item.type !== "page") {
              outPath = `${outDir}/${lang}/${TYPE_ROUTES_MAPPING[item.type].routeFix}/${adjustedPath}`;
            }
            // ---

            //Write content file for static prefetch of pages
            //Create export folder for given language
            mkdirp.sync(outPath, err => {
              console.log(`Error generating export dir`, err);
            });

            const data =
              {
                ...commonDocumentsForLangs[lang],
                ...item.data,
                uid: item.uid
              } || commonDocumentsForLangs[lang];

            // We remove some heavy common data from pages that don't need it
            Object.keys(data).forEach(dataObject => {
              if (
                prismicApi.COMMON_DOCUMENTS_FOR_PAGE_LISTED.indexOf(
                  dataObject
                ) >= 0
              ) {
                const section = outPath.split("/")[
                  outPath.split("/").length -
                  (TYPE_ROUTES_MAPPING[item.type].routeFix ? 2 : 1)
                ];
                if (
                  !prismicApi.COMMON_DOCUMENTS_FOR_PAGE[section] ||
                  prismicApi.COMMON_DOCUMENTS_FOR_PAGE[section].indexOf(
                    dataObject
                  ) < 0
                ) {
                  delete data[dataObject];
                }
              }
            });
            // ---

            fs.writeFile(
              path.join(outPath, "content.json"),
              JSON.stringify(data),
              err => {
                if (err) {
                  console.log(
                    `Error generating content data file for ${lang}/${adjustedPath} file`,
                    err
                  );
                }
              }
            );


            let pagePath = `/${lang}/${
              sectionUrl ? `${sectionUrl}/` : ""
              }${adjustedPath}`;

            // If custom type of page, adjust the path
            if (TYPE_ROUTES_MAPPING[item.type] && item.type !== "page") {
              pagePath = `/${lang}/${TYPE_ROUTES_MAPPING[item.type].routeFix}/${adjustedPath}`;
            }
            // ---

            const obj = {
              [pagePath]: {
                page: TYPE_ROUTES_MAPPING[item.type].pagePath,
                query: TYPE_ROUTES_MAPPING[item.type].queryData
                  ? {
                    [TYPE_ROUTES_MAPPING[item.type].queryData]: adjustedPath
                  }
                  : {}
              }
            };

            if (fix404) {
              result = Object.assign(result, {
                ["/error.html"]: {
                  page: TYPE_ROUTES_MAPPING[item.type].pagePath,
                  query: TYPE_ROUTES_MAPPING[item.type].queryData
                    ? {
                      [TYPE_ROUTES_MAPPING[item.type]
                        .queryData]: adjustedPath
                    }
                    : {}
                }
              });
            }

            result = Object.assign(result, obj);
          });
        });
        resolve(result);
      })
      .catch(e => {
        reject(new Error(`Export failed while fetching data. Error: ${e}`))
      });

  });
};

/**
 * Module exported functions
 */
module.exports = {
  getMap
};
